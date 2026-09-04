import { z } from "zod";
export const create = z.strictObject({
  idempotencyKey: z.uuid(),
  supplierId: z.number().int().positive(),
  invoiceNumber: z.string().trim().max(60).optional(),
  items: z
    .array(
      z.strictObject({
        productId: z.number().int().positive(),
        quantity: z.number().positive().multipleOf(0.001),
        unitCost: z.number().nonnegative().multipleOf(0.01),
      }),
    )
    .min(1)
    .max(200)
    .refine(
      (items) => new Set(items.map((item) => item.productId)).size === items.length,
      "Não repita produtos na compra",
    ),
});
