import type { NextFunction, Request, Response } from "express";
import prisma from "../config/prisma.js";

export async function getCategories(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const categories = await prisma.category.findMany({
      where: {
        isActive: true,
      },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    res.status(200).json({
      success: true,
      data: categories.map((category) => ({
        id: category.id,
        name: category.name,
        description: category.description,
        productCount: category._count.products,
      })),
    });
  } catch (error) {
    next(error);
  }
}