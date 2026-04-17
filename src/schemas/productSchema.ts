import { z } from 'zod';

export const create = z.object({
  name: z.string().min(1),
  barcode: z.string().min(1),
  price: z.number().positive(),
  stockQuantity: z.number().int().nonnegative(),
});