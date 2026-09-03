ALTER TABLE "Sale" ADD COLUMN "creditPaidAmount" DECIMAL(12,2) NOT NULL DEFAULT 0;
UPDATE "Sale" SET "creditPaidAmount" = "totalAmount"
WHERE "paymentMethod" = 'fiado' AND "creditPaidAt" IS NOT NULL;

CREATE TABLE "CreditPayment" (
  "id" SERIAL NOT NULL,
  "customerId" INTEGER NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CreditPayment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CreditPayment_amount_positive" CHECK ("amount" > 0),
  CONSTRAINT "CreditPayment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "CreditPayment_customerId_createdAt_idx" ON "CreditPayment"("customerId", "createdAt");
INSERT INTO "CreditPayment" ("customerId", "amount", "createdAt")
SELECT "customerId", "totalAmount", "creditPaidAt" FROM "Sale"
WHERE "paymentMethod" = 'fiado' AND "creditPaidAt" IS NOT NULL AND "customerId" IS NOT NULL;
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_credit_paid_amount_valid"
CHECK ("creditPaidAmount" >= 0 AND "creditPaidAmount" <= "totalAmount");
