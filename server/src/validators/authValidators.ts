import * as z from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Enter a valid email address")
    .transform((email) => email.toLowerCase()),

  password: z
    .string()
    .min(1, "Password is required")
    .refine(
      (password) => Buffer.byteLength(password, "utf8") <= 72,
      "Password cannot exceed 72 UTF-8 bytes"
    ),
});