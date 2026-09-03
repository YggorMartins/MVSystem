import { z } from "zod";

export const create = z.strictObject({
  name: z.string().min(1),
  barcode: z.string().min(1),
  price: z.number().positive().multipleOf(0.01),
  stockQuantity: z.number().nonnegative().multipleOf(0.001),
});
