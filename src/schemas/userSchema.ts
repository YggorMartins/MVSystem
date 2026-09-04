import { z } from "zod";

export const createUser = z.strictObject({
  email: z.string().trim().toLowerCase().pipe(z.email("Informe um e-mail válido")),
  password: z.string().min(12, "A senha deve possuir pelo menos 12 caracteres").max(72),
  role: z.enum(["admin", "gerente", "caixa", "estoque"]),
});

export const updateUser = z
  .strictObject({
    email: z.string().trim().toLowerCase().pipe(z.email("Informe um e-mail válido")).optional(),
    password: z
      .string()
      .min(12, "A senha deve possuir pelo menos 12 caracteres")
      .max(72)
      .optional(),
    role: z.enum(["admin", "gerente", "caixa", "estoque"]).optional(),
    active: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, "Informe ao menos uma alteração");
