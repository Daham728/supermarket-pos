import type { NextFunction, Request, Response } from "express";
import prisma from "../config/prisma.js";
import {
  createProductSchema,
  updateProductSchema,
} from "../validators/productValidators.js";
import {
  convertToCents,
  formatProduct,
} from "../utils/productFormatter.js";

function getValidationErrors(
  issues: Array<{ path: PropertyKey[]; message: string }>
) {
  return issues.map((issue) => ({
    field: issue.path.join(".") || "request",
    message: issue.message,
  }));
}

function parseProductId(
  value: string | string[] | undefined
): number | null {
  const rawValue = Array.isArray(value) ? value[0] : value;

  if (!rawValue) {
    return null;
  }

  const id = Number(rawValue);

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
}

// GET /api/products
export async function getProducts(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const search =
      typeof req.query.search === "string"
        ? req.query.search.trim()
        : "";

    const includeInactive = req.query.includeInactive === "true";

    const pageValue = Number(req.query.page);
    const limitValue = Number(req.query.limit);

    const page =
      Number.isInteger(pageValue) && pageValue > 0 ? pageValue : 1;

    const limit =
      Number.isInteger(limitValue) && limitValue > 0
        ? Math.min(limitValue, 100)
        : 20;

    let categoryId: number | undefined;

    if (req.query.categoryId !== undefined) {
      categoryId = Number(req.query.categoryId);

      if (!Number.isInteger(categoryId) || categoryId <= 0) {
        res.status(400).json({
          success: false,
          message: "categoryId must be a positive whole number",
        });
        return;
      }
    }

    const where = {
      ...(includeInactive ? {} : { isActive: true }),

      ...(categoryId !== undefined ? { categoryId } : {}),

      ...(search
        ? {
            OR: [
              {
                name: {
                  contains: search,
                },
              },
              {
                barcode: {
                  contains: search,
                },
              },
              {
                sku: {
                  contains: search,
                },
              },
            ],
          }
        : {}),
    };

    const [products, totalProducts] = await prisma.$transaction([
      prisma.product.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          name: "asc",
        },
        skip: (page - 1) * limit,
        take: limit,
      }),

      prisma.product.count({
        where,
      }),
    ]);

    res.status(200).json({
      success: true,
      data: products.map(formatProduct),
      pagination: {
        page,
        limit,
        totalProducts,
        totalPages: Math.ceil(totalProducts / limit),
      },
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/products/:id
export async function getProductById(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = parseProductId(req.params.id);

    if (!id) {
      res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
      return;
    }

    const product = await prisma.product.findUnique({
      where: {
        id,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!product) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: formatProduct(product),
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/products/barcode/:barcode
export async function getProductByBarcode(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const barcode = String(req.params.barcode ?? "").trim();

    if (!barcode) {
      res.status(400).json({
        success: false,
        message: "Barcode is required",
      });
      return;
    }

    const product = await prisma.product.findFirst({
      where: {
        barcode,
        isActive: true,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!product) {
      res.status(404).json({
        success: false,
        message: "No active product was found for this barcode",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: formatProduct(product),
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/products
export async function createProduct(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const validation = createProductSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Product validation failed",
        errors: getValidationErrors(validation.error.issues),
      });
      return;
    }

    const productData = validation.data;

    const category = await prisma.category.findFirst({
      where: {
        id: productData.categoryId,
        isActive: true,
      },
    });

    if (!category) {
      res.status(400).json({
        success: false,
        message: "The selected category does not exist or is inactive",
      });
      return;
    }

    const existingBarcode = await prisma.product.findUnique({
      where: {
        barcode: productData.barcode,
      },
    });

    if (existingBarcode) {
      res.status(409).json({
        success: false,
        message: "A product with this barcode already exists",
      });
      return;
    }

    const existingSku = await prisma.product.findUnique({
      where: {
        sku: productData.sku,
      },
    });

    if (existingSku) {
      res.status(409).json({
        success: false,
        message: "A product with this SKU already exists",
      });
      return;
    }

    const product = await prisma.product.create({
      data: {
        barcode: productData.barcode,
        sku: productData.sku,
        name: productData.name,
        description: productData.description ?? null,
        costPriceCents: convertToCents(productData.costPrice),
        sellingPriceCents: convertToCents(productData.sellingPrice),
        stockQuantity: productData.stockQuantity,
        reorderLevel: productData.reorderLevel,
        unit: productData.unit,
        categoryId: productData.categoryId,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: formatProduct(product),
    });
  } catch (error) {
    next(error);
  }
}

// PUT /api/products/:id
export async function updateProduct(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = parseProductId(req.params.id);

    if (!id) {
      res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
      return;
    }

    const validation = updateProductSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Product validation failed",
        errors: getValidationErrors(validation.error.issues),
      });
      return;
    }

    const existingProduct = await prisma.product.findUnique({
      where: {
        id,
      },
    });

    if (!existingProduct) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
      return;
    }

    const productData = validation.data;

    if (productData.barcode !== undefined) {
      const duplicateBarcode = await prisma.product.findFirst({
        where: {
          barcode: productData.barcode,
          id: {
            not: id,
          },
        },
      });

      if (duplicateBarcode) {
        res.status(409).json({
          success: false,
          message: "Another product already uses this barcode",
        });
        return;
      }
    }

    if (productData.sku !== undefined) {
      const duplicateSku = await prisma.product.findFirst({
        where: {
          sku: productData.sku,
          id: {
            not: id,
          },
        },
      });

      if (duplicateSku) {
        res.status(409).json({
          success: false,
          message: "Another product already uses this SKU",
        });
        return;
      }
    }

    if (productData.categoryId !== undefined) {
      const category = await prisma.category.findFirst({
        where: {
          id: productData.categoryId,
          isActive: true,
        },
      });

      if (!category) {
        res.status(400).json({
          success: false,
          message: "The selected category does not exist or is inactive",
        });
        return;
      }
    }

    const finalCostPriceCents =
      productData.costPrice !== undefined
        ? convertToCents(productData.costPrice)
        : existingProduct.costPriceCents;

    const finalSellingPriceCents =
      productData.sellingPrice !== undefined
        ? convertToCents(productData.sellingPrice)
        : existingProduct.sellingPriceCents;

    if (finalSellingPriceCents < finalCostPriceCents) {
      res.status(400).json({
        success: false,
        message: "Selling price cannot be lower than cost price",
      });
      return;
    }

    const updatedProduct = await prisma.product.update({
      where: {
        id,
      },
      data: {
        ...(productData.barcode !== undefined && {
          barcode: productData.barcode,
        }),

        ...(productData.sku !== undefined && {
          sku: productData.sku,
        }),

        ...(productData.name !== undefined && {
          name: productData.name,
        }),

        ...(productData.description !== undefined && {
          description: productData.description,
        }),

        ...(productData.costPrice !== undefined && {
          costPriceCents: convertToCents(productData.costPrice),
        }),

        ...(productData.sellingPrice !== undefined && {
          sellingPriceCents: convertToCents(productData.sellingPrice),
        }),

        ...(productData.stockQuantity !== undefined && {
          stockQuantity: productData.stockQuantity,
        }),

        ...(productData.reorderLevel !== undefined && {
          reorderLevel: productData.reorderLevel,
        }),

        ...(productData.unit !== undefined && {
          unit: productData.unit,
        }),

        ...(productData.categoryId !== undefined && {
          categoryId: productData.categoryId,
        }),
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: formatProduct(updatedProduct),
    });
  } catch (error) {
    next(error);
  }
}

// PATCH /api/products/:id/deactivate
export async function deactivateProduct(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = parseProductId(req.params.id);

    if (!id) {
      res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
      return;
    }

    const existingProduct = await prisma.product.findUnique({
      where: {
        id,
      },
    });

    if (!existingProduct) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
      return;
    }

    if (!existingProduct.isActive) {
      res.status(200).json({
        success: true,
        message: "Product is already inactive",
      });
      return;
    }

    const product = await prisma.product.update({
      where: {
        id,
      },
      data: {
        isActive: false,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: "Product deactivated successfully",
      data: formatProduct(product),
    });
  } catch (error) {
    next(error);
  }
}