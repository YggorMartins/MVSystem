import { z } from "zod";

export const register = z.strictObject({
  email: z.string().trim().toLowerCase().max(254).pipe(z.email("Informe um e-mail válido")),
  password: z.string().min(12, "A senha deve ter pelo menos 12 caracteres").max(72),
});

export const login = z.strictObject({
  email: z.string().trim().toLowerCase().max(254).pipe(z.email("Informe um e-mail válido")),
  password: z.string().min(1, "Informe a senha").max(72),
});
