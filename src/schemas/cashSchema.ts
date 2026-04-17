import { z } from 'zod';

export const open = z.object({
  initialAmount: z.number().nonnegative(),
});

export const close = z.object({});

export const movement = z.object({
  cashRegisterId: z.number().int().positive(),
  type: z.enum(['in', 'out']),
  amount: z.number().positive(),
  description: z.string().optional(),
});