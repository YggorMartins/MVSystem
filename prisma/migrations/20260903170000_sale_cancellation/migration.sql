ALTER TABLE "Sale" ADD COLUMN "cancelledAt" TIMESTAMP(3);
CREATE INDEX "Sale_createdAt_cancelledAt_idx" ON "Sale"("createdAt", "cancelledAt");
