ALTER TABLE "Product"
  ADD COLUMN "costPrice" DECIMAL(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN "unit" VARCHAR(10) NOT NULL DEFAULT 'UN',
  ADD COLUMN "lowStockThreshold" DECIMAL(14,3) NOT NULL DEFAULT 0,
  ALTER COLUMN "categoryId" DROP NOT NULL;

ALTER TABLE "Product"
  ADD CONSTRAINT "Product_cost_nonnegative" CHECK ("costPrice" >= 0),
  ADD CONSTRAINT "Product_low_stock_nonnegative" CHECK ("lowStockThreshold" >= 0);

CREATE INDEX "Product_categoryId_name_idx" ON "Product"("categoryId", "name");
