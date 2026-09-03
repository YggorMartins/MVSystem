import { z } from 'zod';

export const create = z.strictObject({
  idempotencyKey: z.uuid(),
  paymentMethod: z.enum(['dinheiro', 'cartao_credito', 'cartao_debito', 'pix', 'fiado']),
  cashRegisterId: z.number().int().positive(),
  items: z.array(
    z.strictObject({
      productId: z.number().int().positive(),
      quantity: z.number().positive().multipleOf(0.001),
    })
  ).min(1),
});
