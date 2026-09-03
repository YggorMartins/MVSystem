import { z } from "zod";

export const create = z.strictObject({
  name: z.string().trim().min(2, "O nome deve ter pelo menos 2 caracteres").max(120),
  phone: z.string().trim().max(30).optional(),
});

export const payment = z.strictObject({
  amount: z
    .number()
    .positive("O pagamento deve ser maior que zero")
    .multipleOf(0.01, "Use no máximo duas casas decimais"),
});
