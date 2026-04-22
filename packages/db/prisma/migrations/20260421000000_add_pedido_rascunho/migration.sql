-- CreateTable
CREATE TABLE "PedidoRascunho" (
    "id" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "inscricoesJson" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PedidoRascunho_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PedidoRascunho_pedidoId_key" ON "PedidoRascunho"("pedidoId");

-- AddForeignKey
ALTER TABLE "PedidoRascunho" ADD CONSTRAINT "PedidoRascunho_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido"("id") ON DELETE CASCADE ON UPDATE CASCADE;
