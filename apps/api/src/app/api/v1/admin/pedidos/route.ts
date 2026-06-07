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
  if (!token) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const secret = new TextEncoder().encode(process.env.ADMIN_JWT_SECRET!);
    await jwtVerify(token, secret);
  } catch {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
  const status = searchParams.get("status") ?? "";
  const metodoPagamento = searchParams.get("metodo") ?? "";
  const q = searchParams.get("q") ?? "";

  const where = {
    ...(status ? { status: status as never } : {}),
    ...(metodoPagamento ? { metodoPagamento: metodoPagamento as never } : {}),
    ...(q ? { numeroPedido: { contains: q, mode: "insensitive" as const } } : {}),
  };

  const [pedidos, total] = await Promise.all([
    prisma.pedido.findMany({
      where,
      select: {
        id: true,
        numeroPedido: true,
        status: true,
        metodoPagamento: true,
        total: true,
        createdAt: true,
        _count: { select: { participantes: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.pedido.count({ where }),
  ]);

  return NextResponse.json({
    pedidos: pedidos.map((p) => ({
      ...p,
      createdAt: p.createdAt.toISOString(),
      participantesCount: p._count.participantes,
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
