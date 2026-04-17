import { z } from 'zod';

export const create = z.object({
  totalAmount: z.number().positive(),
  paymentMethod: z.string(),
  cashRegisterId: z.number().int().positive(),
  items: z.array(
    z.object({
      productId: z.number().int().positive(),
      quantity: z.number().int().positive(),
      unitPrice: z.number().positive(),
    })
  ).min(1),
});