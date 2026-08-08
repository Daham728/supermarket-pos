import { z } from "zod";

const maximumMoneyValue = 2_000_000_000;

const saleItemSchema = z.object({
  productId: z
    .number()
    .int("Product ID must be an integer")
    .positive("Product ID must be positive"),

  quantity   : z
    .number()
    .int("Quantity must be an integer")
    .positive("Quantity must be at least 1")
    .max(10_000, "Quantity is too large"),
});

export const createSaleSchema = z.object({
  paymentMethod: z.literal("CASH"),

  amountPaidCents: z
    .number()
    .int("Amount paid must be an integer number of cents")
    .nonnegative("Amount paid cannot be negative")
    .max(maximumMoneyValue, "Amount paid is too large"),

  discountCents: z
    .number()
    .int("Discount must be an integer number of cents")
    .nonnegative("Discount cannot be negative")
    .max(maximumMoneyValue, "Discount is too large")
    .optional()
    .default(0),

  items: z
    .array(saleItemSchema)
    .min(1, "At least one product is required")
    .max(100, "A sale cannot contain more than 100 products"),
});