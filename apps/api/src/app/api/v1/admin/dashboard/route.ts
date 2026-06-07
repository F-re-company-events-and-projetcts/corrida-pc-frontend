import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@corrida/db";

function getToken(req: NextRequest): string | null {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  return auth.slice(7);
}

export async function GET(req: NextRequest) {
  const token = getToken(req);
  if (!token) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const secret = new TextEncoder().encode(process.env.ADMIN_JWT_SECRET!);
    await jwtVerify(token, secret);
  } catch {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }

  const [
    totalInscricoes,
    totalPedidos,
    pedidosPagos,
    pedidosAguardando,
    pedidosExpirados,
    pedidosRecusados,
    receitaResult,
    vagasPorCategoria,
    metodosPagamento,
    checkinTotal,
    checkinFeitos,
    camisetasPorTamanho,
    ultimasInscricoes,
    inscricoesPorDiaRaw,
  ] = await Promise.all([
    prisma.participante.count(),
    prisma.pedido.count(),
    prisma.pedido.count({ where: { status: "PAGO" } }),
    prisma.pedido.count({ where: { status: "AGUARDANDO_PAGAMENTO" } }),
    prisma.pedido.count({ where: { status: "EXPIRADO" } }),
    prisma.pedido.count({ where: { status: "RECUSADO" } }),
    prisma.pedido.aggregate({
      _sum: { total: true },
      where: { status: "PAGO" },
    }),
    prisma.categoria.findMany({
      select: { id: true, nome: true, percursoKm: true, tipo: true, vagasOcupadas: true, vagasTotal: true },
      orderBy: [{ percursoKm: "asc" }, { tipo: "asc" }],
    }),
    prisma.pedido.groupBy({
      by: ["metodoPagamento"],
      where: { status: "PAGO" },
      _count: { _all: true },
      _sum: { total: true },
    }),
    prisma.participante.count(),
    prisma.participante.count({ where: { checkinRealizadoEm: { not: null } } }),
    prisma.participante.groupBy({
      by: ["tamanhoCamiseta"],
      _count: { _all: true },
      orderBy: { tamanhoCamiseta: "asc" },
    }),
    prisma.participante.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      select: {
        nome: true,
        createdAt: true,
        categoria: { select: { nome: true } },
        pedido: { select: { metodoPagamento: true } },
      },
    }),
    prisma.$queryRaw<{ data: string; count: number }[]>`
      SELECT
        TO_CHAR(DATE_TRUNC('day', "createdAt"), 'YYYY-MM-DD') AS data,
        COUNT(*)::int AS count
      FROM "Participante"
      WHERE "createdAt" >= NOW() - INTERVAL '14 days'
      GROUP BY DATE_TRUNC('day', "createdAt")
      ORDER BY DATE_TRUNC('day', "createdAt") ASC
    `,
  ]);

  const porMetodoPagamento = {
    PIX: { pedidos: 0, receita: 0 },
    CARTAO: { pedidos: 0, receita: 0 },
  };
  for (const m of metodosPagamento) {
    const key = m.metodoPagamento as "PIX" | "CARTAO";
    porMetodoPagamento[key] = {
      pedidos: m._count._all,
      receita: m._sum.total ?? 0,
    };
  }

  return NextResponse.json({
    totalInscricoes,
    totalPedidos,
    pedidosPagos,
    pedidosAguardando,
    pedidosExpirados,
    pedidosRecusados,
    receitaTotal: receitaResult._sum.total ?? 0,
    vagasPorCategoria,
    porMetodoPagamento,
    checkinProgress: { total: checkinTotal, feitos: checkinFeitos },
    camisetasPorTamanho: camisetasPorTamanho.map((c) => ({
      tamanho: c.tamanhoCamiseta,
      count: c._count._all,
    })),
    ultimasInscricoes: ultimasInscricoes.map((p) => ({
      nome: p.nome,
      categoria: p.categoria.nome,
      metodoPagamento: p.pedido.metodoPagamento,
      createdAt: p.createdAt.toISOString(),
    })),
    inscricoesPorDia: inscricoesPorDiaRaw.map((r) => ({
      data: r.data,
      count: Number(r.count),
    })),
  });
}
