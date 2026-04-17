import { z } from 'zod';

export const register = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['user', 'admin']).optional(),
});

export const login = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});