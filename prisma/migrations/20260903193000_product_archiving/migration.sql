ALTER TABLE "Product" ADD COLUMN "archivedAt" TIMESTAMP(3);
CREATE INDEX "Product_archivedAt_name_idx" ON "Product"("archivedAt", "name");
