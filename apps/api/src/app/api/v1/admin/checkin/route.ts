import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@corrida/db";
import { z } from "zod";

function getToken(req: NextRequest): string | null {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  return auth.slice(7);
}

const BodySchema = z.object({
  numeroPeito: z.number().int().positive(),
});

export async function POST(req: NextRequest) {
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

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "numeroPeito deve ser um inteiro positivo" },
      { status: 400 }
    );
  }

  const { numeroPeito } = parsed.data;

  const participante = await prisma.participante.findFirst({
    where: { numeroPeito },
    select: {
      id: true,
      nome: true,
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

  if (participante.checkinRealizadoEm !== null) {
    return NextResponse.json(
      {
        error: "Check-in já realizado",
        checkinRealizadoEm: participante.checkinRealizadoEm,
        nome: participante.nome,
      },
      { status: 409 }
    );
  }

  if (participante.pedido.status !== "PAGO") {
    return NextResponse.json(
      {
        error: "Pagamento não confirmado",
        status: participante.pedido.status,
      },
      { status: 422 }
    );
  }

  const updated = await prisma.participante.update({
    where: { id: participante.id },
    data: { checkinRealizadoEm: new Date() },
    select: {
      nome: true,
      numeroPeito: true,
      categoria: { select: { nome: true, percursoKm: true } },
    },
  });

  return NextResponse.json({
    ok: true,
    nome: updated.nome,
    categoria: updated.categoria,
    numeroPeito: updated.numeroPeito,
  });
}
