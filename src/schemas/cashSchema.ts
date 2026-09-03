import { z } from 'zod';

export const open = z.strictObject({
  initialAmount: z.number("O valor inicial deve ser um número").nonnegative("O valor inicial não pode ser negativo").multipleOf(0.01, "O valor inicial deve ter no máximo duas casas decimais"),
});

export const close = z.strictObject({
  closingAmount: z.number("O valor final deve ser um número").nonnegative("O valor final não pode ser negativo").multipleOf(0.01, "O valor final deve ter no máximo duas casas decimais"),
});

export const movement = z.strictObject({
  cashRegisterId: z.number("Informe o caixa").int("O caixa deve ser um inteiro").positive("O caixa deve ser positivo"),
  type: z.enum(["in", "out"], { error: "O tipo deve ser uma entrada ou saída" }),
  amount: z.number("O valor deve ser um número").positive("O valor deve ser positivo").multipleOf(0.01, "O valor deve ter no máximo duas casas decimais"),
  description: z.string().trim().max(500, "A descrição deve ter no máximo 500 caracteres").optional(),
});
