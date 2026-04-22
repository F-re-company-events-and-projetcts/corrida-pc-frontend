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
    receitaResult,
    vagasPorCategoria,
  ] = await Promise.all([
    prisma.participante.count(),
    prisma.pedido.count(),
    prisma.pedido.count({ where: { status: "PAGO" } }),
    prisma.pedido.count({ where: { status: "AGUARDANDO_PAGAMENTO" } }),
    prisma.pedido.count({ where: { status: "EXPIRADO" } }),
    prisma.pedido.aggregate({
      _sum: { total: true },
      where: { status: "PAGO" },
    }),
    prisma.categoria.findMany({
      select: {
        id: true,
        nome: true,
        percursoKm: true,
        tipo: true,
        vagasOcupadas: true,
        vagasTotal: true,
      },
      orderBy: [{ percursoKm: "asc" }, { tipo: "asc" }],
    }),
  ]);

  return NextResponse.json({
    totalInscricoes,
    totalPedidos,
    pedidosPagos,
    pedidosAguardando,
    pedidosExpirados,
    receitaTotal: receitaResult._sum.total ?? 0,
    vagasPorCategoria,
  });
}
