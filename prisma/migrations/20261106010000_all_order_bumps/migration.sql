-- Todos os order bumps ativos e exibidos no checkout.
UPDATE "Product" SET "orderBumpEnabled" = true, "active" = true
WHERE "type" = 'ORDER_BUMP';
UPDATE "Product" SET "orderBumpPriceCents" = "priceCents"
WHERE "type" = 'ORDER_BUMP' AND "orderBumpPriceCents" IS NULL;
