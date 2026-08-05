import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@corrida/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const where = id.startsWith("PC-") ? { numeroPedido: id } : { id };

  const pedido = await prisma.pedido.findUnique({
    where,
    select: {
      id: true,
      numeroPedido: true,
      status: true,
      expiresAt: true,
      metodoPagamento: true,
      total: true,
      updatedAt: true,
      participantes: {
        select: {
          id: true,
          nome: true,
          numeroPeito: true,
          categoria: { select: { nome: true } },
        },
      },
    },
  });

  if (!pedido) {
    return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
  }

  return NextResponse.json({
    id: pedido.id,
    numeroPedido: pedido.numeroPedido,
    status: pedido.status,
    expiresAt: pedido.expiresAt?.toISOString() ?? null,
    metodoPagamento: pedido.metodoPagamento,
    total: pedido.total,
    updatedAt: pedido.updatedAt.toISOString(),
    participantes: pedido.participantes.map((p: (typeof pedido.participantes)[number]) => ({
      id: p.id,
      nome: p.nome,
      numeroPeito: p.numeroPeito,
      categoria: p.categoria.nome,
    })),
  });
}
