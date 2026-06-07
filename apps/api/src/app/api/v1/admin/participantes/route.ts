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
  const faixaEtaria = searchParams.get("faixa") ?? "";

  // Faixa etária: calcular intervalo de dataNascimento
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = hoje.getMonth();
  const dia = hoje.getDate();

  const faixaFilter: { gte?: Date; lte?: Date } | undefined = (() => {
    switch (faixaEtaria) {
      case "menor18": return { gte: new Date(ano - 17, mes, dia) };
      case "18a29":   return { gt: new Date(ano - 30, mes, dia), lte: new Date(ano - 18, mes, dia) } as never;
      case "30a39":   return { gt: new Date(ano - 40, mes, dia), lte: new Date(ano - 30, mes, dia) } as never;
      case "40a49":   return { gt: new Date(ano - 50, mes, dia), lte: new Date(ano - 40, mes, dia) } as never;
      case "50mais":  return { lte: new Date(ano - 50, mes, dia) };
      default: return undefined;
    }
  })();

  const where = {
    ...(categoriaId ? { categoriaId } : {}),
    ...(status ? { pedido: { status: status as never } } : {}),
    ...(faixaFilter ? { dataNascimento: faixaFilter } : {}),
    ...(q
      ? {
          OR: [
            { nome: { contains: q, mode: "insensitive" as const } },
            { email: { contains: q, mode: "insensitive" as const } },
            { pedido: { numeroPedido: { contains: q, mode: "insensitive" as const } } },
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
          select: { id: true, numeroPedido: true, status: true, metodoPagamento: true, total: true },
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
