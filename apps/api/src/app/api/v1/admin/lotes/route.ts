import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@corrida/db";
import { z } from "zod";

const CriarLoteSchema = z.object({
  nome: z.string().min(1),
  precoCidadao: z.number().positive(),
  dataInicio: z.string().datetime(),
  dataFim: z.string().datetime(),
  ativo: z.boolean().default(false),
});

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

  const lotes = await prisma.lote.findMany({
    orderBy: { dataInicio: "asc" },
  });

  return NextResponse.json(lotes);
}

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
  try { rawBody = await req.json(); } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const parsed = CriarLoteSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten() }, { status: 400 });
  }

  const { nome, precoCidadao, dataInicio, dataFim, ativo } = parsed.data;

  if (ativo) {
    await prisma.lote.updateMany({ data: { ativo: false } });
  }

  const lote = await prisma.lote.create({
    data: { nome, precoCidadao, dataInicio: new Date(dataInicio), dataFim: new Date(dataFim), ativo },
  });

  return NextResponse.json(lote, { status: 201 });
}
