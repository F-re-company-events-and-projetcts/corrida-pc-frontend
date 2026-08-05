import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@corrida/db"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()

  const pedidosExpirados = await prisma.pedido.findMany({
    where: {
      status: "AGUARDANDO_PAGAMENTO",
      metodoPagamento: "PIX",
      expiresAt: { lt: now },
    },
    select: { id: true },
  })

  if (pedidosExpirados.length === 0) {
    return NextResponse.json({ ok: true, expirados: 0 })
  }

  const ids = pedidosExpirados.map((p) => p.id)

  await prisma.$transaction([
    prisma.pedidoRascunho.deleteMany({
      where: { pedidoId: { in: ids } },
    }),
    prisma.pedido.updateMany({
      where: { id: { in: ids } },
      data: { status: "EXPIRADO" },
    }),
  ])

  return NextResponse.json({ ok: true, expirados: ids.length })
}
