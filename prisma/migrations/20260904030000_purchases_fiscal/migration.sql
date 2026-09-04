CREATE TYPE "FiscalEnvironment" AS ENUM ('simulation', 'homologation', 'production');
CREATE TYPE "FiscalStatus" AS ENUM ('authorized_simulation', 'authorized', 'cancelled', 'rejected');

CREATE TABLE "Supplier" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "document" TEXT,
  "phone" TEXT,
  "email" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "Supplier_document_key" ON "Supplier"("document");

CREATE TABLE "Purchase" (
  "id" SERIAL PRIMARY KEY,
  "idempotencyKey" UUID NOT NULL,
  "supplierId" INTEGER NOT NULL REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "invoiceNumber" TEXT,
  "totalAmount" DECIMAL(12,2) NOT NULL,
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "cancelledAt" TIMESTAMP(3)
);
CREATE UNIQUE INDEX "Purchase_idempotencyKey_key" ON "Purchase"("idempotencyKey");
CREATE UNIQUE INDEX "Purchase_supplierId_invoiceNumber_key" ON "Purchase"("supplierId", "invoiceNumber");
CREATE INDEX "Purchase_receivedAt_idx" ON "Purchase"("receivedAt");
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_total_positive" CHECK ("totalAmount" > 0);

CREATE TABLE "PurchaseItem" (
  "id" SERIAL PRIMARY KEY,
  "purchaseId" INTEGER NOT NULL REFERENCES "Purchase"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "productId" INTEGER NOT NULL REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "quantity" DECIMAL(14,3) NOT NULL,
  "unitCost" DECIMAL(12,2) NOT NULL
);
CREATE UNIQUE INDEX "PurchaseItem_purchaseId_productId_key" ON "PurchaseItem"("purchaseId", "productId");
ALTER TABLE "PurchaseItem" ADD CONSTRAINT "PurchaseItem_quantity_positive" CHECK ("quantity" > 0);
ALTER TABLE "PurchaseItem" ADD CONSTRAINT "PurchaseItem_unit_cost_nonnegative" CHECK ("unitCost" >= 0);

CREATE TABLE "FiscalDocument" (
  "id" SERIAL PRIMARY KEY,
  "saleId" INTEGER NOT NULL REFERENCES "Sale"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "environment" "FiscalEnvironment" NOT NULL,
  "status" "FiscalStatus" NOT NULL,
  "accessKey" VARCHAR(44) NOT NULL,
  "protocol" TEXT NOT NULL,
  "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "cancelledAt" TIMESTAMP(3)
);
CREATE UNIQUE INDEX "FiscalDocument_saleId_key" ON "FiscalDocument"("saleId");
CREATE UNIQUE INDEX "FiscalDocument_accessKey_key" ON "FiscalDocument"("accessKey");
CREATE UNIQUE INDEX "FiscalDocument_protocol_key" ON "FiscalDocument"("protocol");
