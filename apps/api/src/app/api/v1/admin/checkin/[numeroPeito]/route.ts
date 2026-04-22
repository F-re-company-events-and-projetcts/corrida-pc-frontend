import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@corrida/db";

function getToken(req: NextRequest): string | null {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  return auth.slice(7);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ numeroPeito: string }> }
) {
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

  const { numeroPeito: numeroPeitoStr } = await params;
  const numeroPeito = parseInt(numeroPeitoStr, 10);

  if (!Number.isInteger(numeroPeito) || numeroPeito <= 0) {
    return NextResponse.json(
      { error: "Número de peito inválido" },
      { status: 400 }
    );
  }

  const participante = await prisma.participante.findFirst({
    where: { numeroPeito },
    select: {
      nome: true,
      numeroPeito: true,
      tamanhoCamiseta: true,
      checkinRealizadoEm: true,
      categoria: { select: { nome: true, percursoKm: true } },
      pedido: { select: { status: true } },
    },
  });

  if (!participante) {
    return NextResponse.json(
      { error: "Número de peito não encontrado" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    nome: participante.nome,
    numeroPeito: participante.numeroPeito,
    tamanhoCamiseta: participante.tamanhoCamiseta,
    checkinRealizadoEm: participante.checkinRealizadoEm,
    categoria: participante.categoria,
    pedidoStatus: participante.pedido.status,
  });
}
