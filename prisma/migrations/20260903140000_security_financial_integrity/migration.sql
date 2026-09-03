CREATE TYPE "UserRole" AS ENUM ('admin', 'gerente', 'caixa', 'estoque');
CREATE TYPE "PaymentMethod" AS ENUM ('dinheiro', 'cartao_credito', 'cartao_debito', 'pix', 'fiado');
CREATE TYPE "CashStatus" AS ENUM ('open', 'closed');
CREATE TYPE "CashMovementType" AS ENUM ('in', 'out');

ALTER TABLE "User"
  ALTER COLUMN "role" DROP DEFAULT,
  ALTER COLUMN "role" TYPE "UserRole" USING "role"::"UserRole",
  ALTER COLUMN "role" SET DEFAULT 'caixa';

ALTER TABLE "Product"
  ALTER COLUMN "price" TYPE DECIMAL(12,2) USING ROUND("price"::numeric, 2),
  ALTER COLUMN "stockQuantity" TYPE DECIMAL(14,3) USING "stockQuantity"::numeric;

ALTER TABLE "Sale" ADD COLUMN "idempotencyKey" UUID;
UPDATE "Sale" SET "idempotencyKey" = gen_random_uuid() WHERE "idempotencyKey" IS NULL;
ALTER TABLE "Sale"
  ALTER COLUMN "idempotencyKey" SET NOT NULL,
  ALTER COLUMN "totalAmount" TYPE DECIMAL(12,2) USING ROUND("totalAmount"::numeric, 2),
  ALTER COLUMN "paymentMethod" TYPE "PaymentMethod" USING (
    CASE
      WHEN "paymentMethod" IN ('dinheiro', 'cartao_credito', 'cartao_debito', 'pix', 'fiado')
        THEN "paymentMethod"::"PaymentMethod"
      WHEN LOWER("paymentMethod") IN ('cash', 'money') THEN 'dinheiro'::"PaymentMethod"
      WHEN LOWER("paymentMethod") IN ('credit', 'credit_card', 'card') THEN 'cartao_credito'::"PaymentMethod"
      WHEN LOWER("paymentMethod") IN ('debit', 'debit_card') THEN 'cartao_debito'::"PaymentMethod"
      ELSE 'dinheiro'::"PaymentMethod"
    END
  );

CREATE UNIQUE INDEX "Sale_idempotencyKey_key" ON "Sale"("idempotencyKey");

ALTER TABLE "SaleItem"
  ALTER COLUMN "quantity" TYPE DECIMAL(14,3) USING "quantity"::numeric,
  ALTER COLUMN "unitPrice" TYPE DECIMAL(12,2) USING ROUND("unitPrice"::numeric, 2);

ALTER TABLE "CashRegister" ADD COLUMN "closingAmount" DECIMAL(12,2);
UPDATE "CashRegister"
  SET "closingAmount" = ROUND("initialAmount"::numeric, 2),
      "closedAt" = COALESCE("closedAt", "openedAt")
  WHERE "status" = 'closed';

WITH ranked_open AS (
  SELECT "id", ROW_NUMBER() OVER (ORDER BY "openedAt" DESC, "id" DESC) AS position
  FROM "CashRegister"
  WHERE "status" = 'open'
)
UPDATE "CashRegister" AS register
SET "status" = 'closed',
    "closedAt" = CURRENT_TIMESTAMP,
    "closingAmount" = ROUND(register."initialAmount"::numeric, 2)
FROM ranked_open
WHERE register."id" = ranked_open."id" AND ranked_open.position > 1;
ALTER TABLE "CashRegister"
  ALTER COLUMN "initialAmount" TYPE DECIMAL(12,2) USING ROUND("initialAmount"::numeric, 2),
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "CashStatus" USING "status"::"CashStatus",
  ALTER COLUMN "status" SET DEFAULT 'open';

ALTER TABLE "CashMovement"
  ALTER COLUMN "type" TYPE "CashMovementType" USING "type"::"CashMovementType",
  ALTER COLUMN "amount" TYPE DECIMAL(12,2) USING ROUND("amount"::numeric, 2);

ALTER TABLE "Product"
  ADD CONSTRAINT "Product_price_positive" CHECK ("price" > 0),
  ADD CONSTRAINT "Product_stock_nonnegative" CHECK ("stockQuantity" >= 0);
ALTER TABLE "Sale"
  ADD CONSTRAINT "Sale_total_positive" CHECK ("totalAmount" > 0);
ALTER TABLE "SaleItem"
  ADD CONSTRAINT "SaleItem_quantity_positive" CHECK ("quantity" > 0),
  ADD CONSTRAINT "SaleItem_unit_price_positive" CHECK ("unitPrice" > 0);
ALTER TABLE "CashRegister"
  ADD CONSTRAINT "CashRegister_initial_nonnegative" CHECK ("initialAmount" >= 0),
  ADD CONSTRAINT "CashRegister_closing_nonnegative" CHECK ("closingAmount" IS NULL OR "closingAmount" >= 0),
  ADD CONSTRAINT "CashRegister_closed_state_valid" CHECK (
    ("status" = 'open' AND "closedAt" IS NULL AND "closingAmount" IS NULL)
    OR ("status" = 'closed' AND "closedAt" IS NOT NULL AND "closingAmount" IS NOT NULL)
  );
ALTER TABLE "CashMovement"
  ADD CONSTRAINT "CashMovement_amount_positive" CHECK ("amount" > 0);

CREATE UNIQUE INDEX "CashRegister_single_open_idx"
  ON "CashRegister" (("status")) WHERE "status" = 'open';
