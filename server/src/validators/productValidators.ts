import * as z from "zod";

const productFieldsSchema = z.object({
  barcode: z
    .string()
    .trim()
    .min(3, "Barcode must contain at least 3 characters")
    .max(50, "Barcode cannot exceed 50 characters"),

  sku: z
    .string()
    .trim()
    .min(2, "SKU must contain at least 2 characters")
    .max(30, "SKU cannot exceed 30 characters")
    .transform((value) => value.toUpperCase()),

  name: z
    .string()
    .trim()
    .min(2, "Product name must contain at least 2 characters")
    .max(120, "Product name cannot exceed 120 characters"),

  description: z
    .string()
    .trim()
    .max(500, "Description cannot exceed 500 characters")
    .nullable()
    .optional(),

  costPrice: z
    .number()
    .min(0, "Cost price cannot be negative")
    .max(100_000_000, "Cost price is too large"),

  sellingPrice: z
    .number()
    .positive("Selling price must be greater than zero")
    .max(100_000_000, "Selling price is too large"),

  stockQuantity: z
    .number()
    .int("Stock quantity must be a whole number")
    .min(0, "Stock quantity cannot be negative"),

  reorderLevel: z
    .number()
    .int("Reorder level must be a whole number")
    .min(0, "Reorder level cannot be negative"),

  unit: z
    .string()
    .trim()
    .min(1, "Unit is required")
    .max(20, "Unit cannot exceed 20 characters")
    .transform((value) => value.toUpperCase()),

  categoryId: z
    .number()
    .int("Category ID must be a whole number")
    .positive("A valid category is required"),
});

export const createProductSchema = productFieldsSchema.refine(
  (product) => product.sellingPrice >= product.costPrice,
  {
    message: "Selling price cannot be lower than cost price",
    path: ["sellingPrice"],
  }
);

export const updateProductSchema = productFieldsSchema
  .partial()
  .refine((product) => Object.keys(product).length > 0, {
    message: "Provide at least one field to update",
  });