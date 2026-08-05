CREATE SEQUENCE IF NOT EXISTS "Pedido_numeroPedidoSeq_seq";

ALTER TABLE "Pedido"
ADD COLUMN "numeroPedidoSeq" INTEGER;

ALTER TABLE "Pedido"
ALTER COLUMN "numeroPedidoSeq" SET DEFAULT nextval('"Pedido_numeroPedidoSeq_seq"');

UPDATE "Pedido"
SET "numeroPedidoSeq" = nextval('"Pedido_numeroPedidoSeq_seq"')
WHERE "numeroPedidoSeq" IS NULL;

ALTER TABLE "Pedido"
ALTER COLUMN "numeroPedidoSeq" SET NOT NULL;

ALTER SEQUENCE "Pedido_numeroPedidoSeq_seq" OWNED BY "Pedido"."numeroPedidoSeq";

ALTER TABLE "Pedido"
ADD COLUMN "numeroPedido" TEXT GENERATED ALWAYS AS (
  'PC-2026-' || lpad("numeroPedidoSeq"::text, 6, '0')
) STORED;

CREATE UNIQUE INDEX "Pedido_numeroPedidoSeq_key" ON "Pedido"("numeroPedidoSeq");
CREATE UNIQUE INDEX "Pedido_numeroPedido_key" ON "Pedido"("numeroPedido");
