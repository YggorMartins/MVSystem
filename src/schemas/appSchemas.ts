import { z } from "zod";

export const registerSchema = z.strictObject({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(254, "O e-mail é muito longo")
    .pipe(z.email("Informe um e-mail válido")),
  password: z
    .string()
    .min(12, "A senha deve ter pelo menos 12 caracteres")
    .max(72, "A senha deve ter no máximo 72 caracteres"),
});

export const loginSchema = z.strictObject({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(254, "O e-mail é muito longo")
    .pipe(z.email("Informe um e-mail válido")),
  password: z
    .string()
    .min(1, "Informe a senha")
    .max(72, "A senha deve ter no máximo 72 caracteres"),
});

export const categorySchema = z.strictObject({
  name: z
    .string()
    .trim()
    .min(2, "O nome deve ter pelo menos 2 caracteres")
    .max(50, "O nome deve ter no máximo 50 caracteres"),
});

export const productSchema = z.strictObject({
  name: z.string().trim().min(1, "Informe o nome do produto").max(200, "O nome é muito longo"),
  barcode: z
    .string()
    .trim()
    .min(1, "Informe o código de barras")
    .max(64, "O código de barras é muito longo"),
  price: z
    .number("O preço deve ser um número")
    .positive("O preço deve ser maior que zero")
    .multipleOf(0.01, "O preço deve ter no máximo duas casas decimais"),
  costPrice: z.number().nonnegative().multipleOf(0.01).default(0),
  stockQuantity: z
    .number("O estoque deve ser um número")
    .nonnegative("O estoque não pode ser negativo")
    .multipleOf(0.001, "O estoque deve ter no máximo três casas decimais"),
  unit: z.enum(["UN", "KG", "G", "L", "ML", "CX", "PCT"]).default("UN"),
  lowStockThreshold: z.number().nonnegative().multipleOf(0.001).default(0),
  categoryId: z.number().int().positive().nullable().optional(),
});

export const saleSchema = z
  .strictObject({
    idempotencyKey: z.uuid("Informe uma chave de idempotência UUID válida"),
    paymentMethod: z.enum(["dinheiro", "cartao_credito", "cartao_debito", "pix", "fiado"], {
      error: "Forma de pagamento inválida",
    }),
    cashRegisterId: z
      .number("Informe o caixa")
      .int("O caixa deve ser um inteiro")
      .positive("O caixa deve ser positivo"),
    customerId: z.number().int().positive().optional(),
    items: z
      .array(
        z.strictObject({
          productId: z
            .number("Informe o produto")
            .int("O produto deve ser um inteiro")
            .positive("O produto deve ser positivo"),
          quantity: z
            .number("Informe a quantidade")
            .positive("A quantidade deve ser positiva")
            .multipleOf(0.001, "A quantidade deve ter no máximo três casas decimais"),
        }),
      )
      .min(1, "A venda deve conter pelo menos um item")
      .max(100, "A venda deve conter no máximo 100 itens"),
  })
  .refine((data) => data.paymentMethod !== "fiado" || data.customerId, {
    message: "Informe o cliente para uma venda no fiado",
    path: ["customerId"],
  });

export const customerSchema = z.strictObject({
  name: z.string().trim().min(2, "O nome deve ter pelo menos 2 caracteres").max(120),
  phone: z.string().trim().max(30).optional(),
});
