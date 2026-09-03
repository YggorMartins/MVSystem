CREATE TABLE "Customer" (
  "id" SERIAL NOT NULL,
  "name" VARCHAR(120) NOT NULL,
  "phone" VARCHAR(30),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Sale" ADD COLUMN "customerId" INTEGER;
ALTER TABLE "Sale" ADD COLUMN "creditPaidAt" TIMESTAMP(3);
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "Sale_customerId_paymentMethod_idx" ON "Sale"("customerId", "paymentMethod");
CREATE INDEX "Customer_name_idx" ON "Customer"("name");
