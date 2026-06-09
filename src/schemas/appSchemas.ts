import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email().trim(),
  password: z.string().min(6),
  role: z.enum(["admin", "gerente", "caixa", "estoque"]),
});

export const loginSchema = z.object({
  email: z.string().email().trim(),
  password: z.string(),
});

export const categorySchema = z.object({
  name: z.string().min(2).max(50).trim(),
});

export const productSchema = z.object({
  name: z.string().min(1).trim(),
  barcode: z.string().min(1).trim(),
  price: z.number().positive(),
  stockQuantity: z.number().int().nonnegative(),
  categoryId: z.number().int().positive(),
});

export const saleSchema = z.object({
  totalAmount: z.number().positive(),
  paymentMethod: z.string().min(1),
  cashRegisterId: z.number().int().positive(),
  items: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        quantity: z.number().int().positive(),
        unitPrice: z.number().positive(),
      }),
    )
    .min(1),
});
