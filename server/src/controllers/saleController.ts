import { randomUUID } from "node:crypto";
import type { Request, Response } from "express";
import prisma from "../config/prisma.js";
import { createSaleSchema } from "../validators/saleValidators.js";

class SaleRequestError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = "SaleRequestError";
    this.statusCode = statusCode;
  }
}

function createReceiptNumber(): string {
  const now = new Date();

  const date = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");

  const time = [
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
    String(now.getSeconds()).padStart(2, "0"),
  ].join("");

  const randomPart = randomUUID()
    .slice(0, 6)
    .toUpperCase();

  return `POS-${date}-${time}-${randomPart}`;
}

function getFirstString(
  value: unknown,
): string | undefined {
  if (typeof value === "string") {
    return value;
  }

  if (
    Array.isArray(value) &&
    typeof value[0] === "string"
  ) {
    return value[0];
  }

  return undefined;
}

function parsePositiveInteger(
  value: string | undefined,
): number | null {
  const parsedValue = Number(value);

  if (
    !Number.isInteger(parsedValue) ||
    parsedValue <= 0
  ) {
    return null;
  }

  return parsedValue;
}

export async function createSale(
  req: Request,
  res: Response,
) {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "User is not authenticated",
    });
    return;
  }

  const validation = createSaleSchema.safeParse(
    req.body,
  );

  if (!validation.success) {
    res.status(400).json({
      success: false,
      message: "Sale validation failed",
      errors: validation.error.issues.map(
        (issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        }),
      ),
    });
    return;
  }

  const {
    items,
    paymentMethod,
    amountPaidCents,
  } = validation.data;

  const discountCents =
    validation.data.discountCents ?? 0;

  if (
    discountCents > 0 &&
    req.user.role !== "ADMIN"
  ) {
    res.status(403).json({
      success: false,
      message:
        "Only administrators can apply discounts",
    });
    return;
  }

  const quantityByProduct =
    new Map<number, number>();

  for (const item of items) {
    const currentQuantity =
      quantityByProduct.get(item.productId) ?? 0;

    const combinedQuantity =
      currentQuantity + item.quantity;

    if (combinedQuantity > 10_000) {
      res.status(400).json({
        success: false,
        message:
          "Combined product quantity is too large",
      });
      return;
    }

    quantityByProduct.set(
      item.productId,
      combinedQuantity,
    );
  }

  const requestedItems = Array.from(
    quantityByProduct.entries(),
  ).map(([productId, quantity]) => ({
    productId,
    quantity,
  }));

  const cashierId = req.user.id;

  try {
    const sale = await prisma.$transaction(
      async (transaction) => {
        const productIds = requestedItems.map(
          (item) => item.productId,
        );

        const products =
          await transaction.product.findMany({
            where: {
              id: {
                in: productIds,
              },
              isActive: true,
            },
            select: {
              id: true,
              name: true,
              barcode: true,
              sellingPriceCents: true,
              stockQuantity: true,
            },
          });

        if (
          products.length !== productIds.length
        ) {
          throw new SaleRequestError(
            400,
            "One or more products are unavailable",
          );
        }

        const productById = new Map(
          products.map((product) => [
            product.id,
            product,
          ]),
        );

        let subtotalCents = 0;

        const saleItems = requestedItems.map(
          (requestedItem) => {
            const product = productById.get(
              requestedItem.productId,
            );

            if (!product) {
              throw new SaleRequestError(
                400,
                "A selected product is unavailable",
              );
            }

            if (
              requestedItem.quantity >
              product.stockQuantity
            ) {
              throw new SaleRequestError(
                409,
                `${product.name} only has ${product.stockQuantity} unit(s) available`,
              );
            }

            const lineTotalCents =
              product.sellingPriceCents *
              requestedItem.quantity;

            subtotalCents += lineTotalCents;

            return {
              productId: product.id,
              productName: product.name,
              barcode: product.barcode,
              unitPriceCents:
                product.sellingPriceCents,
              quantity: requestedItem.quantity,
              lineTotalCents,
            };
          },
        );

        if (discountCents > subtotalCents) {
          throw new SaleRequestError(
            400,
            "Discount cannot exceed the subtotal",
          );
        }

        const totalCents =
          subtotalCents - discountCents;

        if (amountPaidCents < totalCents) {
          throw new SaleRequestError(
            400,
            "Amount paid is less than the sale total",
          );
        }

        for (
          const requestedItem of requestedItems
        ) {
          const updatedProduct =
            await transaction.product.updateMany({
              where: {
                id: requestedItem.productId,
                isActive: true,
                stockQuantity: {
                  gte: requestedItem.quantity,
                },
              },
              data: {
                stockQuantity: {
                  decrement:
                    requestedItem.quantity,
                },
              },
            });

          if (updatedProduct.count !== 1) {
            const product = productById.get(
              requestedItem.productId,
            );

            throw new SaleRequestError(
              409,
              `${product?.name ?? "Product"} no longer has enough stock`,
            );
          }
        }

        return transaction.sale.create({
          data: {
            receiptNumber:
              createReceiptNumber(),
            subtotalCents,
            discountCents,
            totalCents,
            paymentMethod,
            amountPaidCents,
            changeCents:
              amountPaidCents - totalCents,
            status: "COMPLETED",
            cashierId,
            items: {
              create: saleItems,
            },
          },
          include: {
            cashier: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
            items: {
              orderBy: {
                id: "asc",
              },
            },
          },
        });
      },
    );

    res.status(201).json({
      success: true,
      message: "Sale completed successfully",
      data: sale,
    });
  } catch (error) {
    if (error instanceof SaleRequestError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
      return;
    }

    console.error("Create sale error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to complete the sale",
    });
  }
}

export async function listSales(
  req: Request,
  res: Response,
) {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "User is not authenticated",
    });
    return;
  }

  const requestedPage = Number.parseInt(
    getFirstString(req.query.page) ?? "1",
    10,
  );

  const requestedLimit = Number.parseInt(
    getFirstString(req.query.limit) ?? "20",
    10,
  );

  const page =
    Number.isInteger(requestedPage) &&
    requestedPage > 0
      ? requestedPage
      : 1;

  const limit =
    Number.isInteger(requestedLimit) &&
    requestedLimit > 0
      ? Math.min(requestedLimit, 100)
      : 20;

  const where =
    req.user.role === "ADMIN"
      ? {}
      : {
          cashierId: req.user.id,
        };

  try {
    const [sales, totalSales] =
      await Promise.all([
        prisma.sale.findMany({
          where,
          include: {
            cashier: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
            items: {
              orderBy: {
                id: "asc",
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          skip: (page - 1) * limit,
          take: limit,
        }),

        prisma.sale.count({
          where,
        }),
      ]);

    res.status(200).json({
      success: true,
      data: sales,
      pagination: {
        page,
        limit,
        totalSales,
        totalPages: Math.ceil(
          totalSales / limit,
        ),
      },
    });
  } catch (error) {
    console.error("List sales error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to retrieve sales",
    });
  }
}

export async function getSaleById(
  req: Request,
  res: Response,
) {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "User is not authenticated",
    });
    return;
  }

  const rawId = Array.isArray(req.params.id)
    ? req.params.id[0]
    : req.params.id;

  const saleId =
    parsePositiveInteger(rawId);

  if (!saleId) {
    res.status(400).json({
      success: false,
      message: "Invalid sale ID",
    });
    return;
  }

  const accessFilter =
    req.user.role === "ADMIN"
      ? {}
      : {
          cashierId: req.user.id,
        };

  try {
    const sale = await prisma.sale.findFirst({
      where: {
        id: saleId,
        ...accessFilter,
      },
      include: {
        cashier: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        items: {
          orderBy: {
            id: "asc",
          },
        },
      },
    });

    if (!sale) {
      res.status(404).json({
        success: false,
        message: "Sale was not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: sale,
    });
  } catch (error) {
    console.error("Get sale error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to retrieve the sale",
    });
  }
}