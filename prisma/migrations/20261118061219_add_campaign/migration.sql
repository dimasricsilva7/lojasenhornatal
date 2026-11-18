-- Aditivo e seguro: colunas nullable, sem impacto no fluxo/dados existentes.
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "campaign" TEXT;
ALTER TABLE "Order"   ADD COLUMN IF NOT EXISTS "campaign" TEXT;
ALTER TABLE "Order"   ADD COLUMN IF NOT EXISTS "trackingCode" TEXT;
ALTER TABLE "Order"   ADD COLUMN IF NOT EXISTS "trackingStatus" TEXT;
CREATE INDEX IF NOT EXISTS "Product_campaign_idx" ON "Product"("campaign");
CREATE INDEX IF NOT EXISTS "Order_campaign_idx" ON "Order"("campaign");
