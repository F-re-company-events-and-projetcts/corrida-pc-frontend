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

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
  const categoriaId = searchParams.get("categoria") ?? "";
  const status = searchParams.get("status") ?? "";
  const q = searchParams.get("q") ?? "";

  const where = {
    ...(categoriaId ? { categoriaId } : {}),
    ...(status ? { pedido: { status: status as never } } : {}),
    ...(q
      ? {
          OR: [
            { nome: { contains: q, mode: "insensitive" as const } },
            { email: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [participantes, total] = await Promise.all([
    prisma.participante.findMany({
      where,
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        tamanhoCamiseta: true,
        numeroPeito: true,
        checkinRealizadoEm: true,
        createdAt: true,
        categoria: {
          select: { nome: true, percursoKm: true },
        },
        pedido: {
          select: { id: true, status: true, metodoPagamento: true, total: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.participante.count({ where }),
  ]);

  return NextResponse.json({
    participantes,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
