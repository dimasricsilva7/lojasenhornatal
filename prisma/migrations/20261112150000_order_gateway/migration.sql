-- Gateway de pagamento do pedido e URL do checkout hospedado (InfinitePay).
ALTER TABLE "Order" ADD COLUMN "gateway" TEXT NOT NULL DEFAULT 'bravopay';
ALTER TABLE "Order" ADD COLUMN "checkoutUrl" TEXT;
