import { z } from "zod";

const optionalText = z.string().trim().max(120).optional().nullable();
export const create = z.strictObject({
  name: z.string().trim().min(2).max(120),
  document: z
    .string()
    .trim()
    .regex(/^\d{11}$|^\d{14}$/, "Informe CPF ou CNPJ somente com números")
    .optional()
    .nullable(),
  phone: optionalText,
  email: z.string().trim().toLowerCase().pipe(z.email()).optional().nullable(),
});
export const update = create
  .partial()
  .extend({ active: z.boolean().optional() })
  .refine((data) => Object.keys(data).length > 0, "Informe ao menos uma alteração");
