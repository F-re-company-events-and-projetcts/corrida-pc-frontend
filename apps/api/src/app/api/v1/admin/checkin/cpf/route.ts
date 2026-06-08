import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@corrida/db";
import bcrypt from "bcryptjs";
import { z } from "zod";

function getToken(req: NextRequest): string | null {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  return auth.slice(7);
}

const BodySchema = z.object({
  cpf: z.string().min(11).max(14),
  dataNascimento: z.string().min(1), // YYYY-MM-DD
});

export async function POST(req: NextRequest) {
  const token = getToken(req);
  if (!token) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

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
    return NextResponse.json({ error: "CPF e data de nascimento são obrigatórios" }, { status: 400 });
  }

  const { cpf, dataNascimento } = parsed.data;
  const cpfDigits = cpf.replace(/\D/g, "");

  // Filtrar por data de nascimento para reduzir o conjunto a comparar
  const dataRef = new Date(dataNascimento + "T12:00:00.000Z");
  const dataInicio = new Date(dataRef);
  dataInicio.setUTCHours(0, 0, 0, 0);
  const dataFim = new Date(dataRef);
  dataFim.setUTCHours(23, 59, 59, 999);

  const candidatos = await prisma.participante.findMany({
    where: {
      dataNascimento: { gte: dataInicio, lte: dataFim },
    },
    select: {
      id: true,
      nome: true,
      cpf: true,
      numeroPeito: true,
      tamanhoCamiseta: true,
      checkinRealizadoEm: true,
      credencialRetiradaEm: true,
      categoria: { select: { nome: true, percursoKm: true, tipo: true } },
      pedido: { select: { status: true } },
    },
  });

  // Bcrypt compare contra o conjunto filtrado (pequeno)
  let encontrado: (typeof candidatos)[number] | null = null;
  for (const c of candidatos) {
    if (await bcrypt.compare(cpfDigits, c.cpf)) {
      encontrado = c;
      break;
    }
  }

  if (!encontrado) {
    return NextResponse.json(
      { error: "Participante não encontrado com esse CPF e data de nascimento." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    nome: encontrado.nome,
    numeroPeito: encontrado.numeroPeito,
    tamanhoCamiseta: encontrado.tamanhoCamiseta,
    checkinRealizadoEm: encontrado.checkinRealizadoEm,
    credencialRetiradaEm: encontrado.credencialRetiradaEm,
    categoria: encontrado.categoria,
    pedidoStatus: encontrado.pedido.status,
    participanteId: encontrado.id,
  });
}
