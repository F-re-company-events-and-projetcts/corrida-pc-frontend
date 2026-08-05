import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@corrida/db";
import { z } from "zod";

function getToken(req: NextRequest): string | null {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  return auth.slice(7);
}

const PatchLoteSchema = z.object({
  precoCidadao: z.number().positive().optional(),
  ativo: z.boolean().optional(),
  dataInicio: z.string().datetime().optional(),
  dataFim: z.string().datetime().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = getToken(req);
  if (!token) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const secret = new TextEncoder().encode(process.env.ADMIN_JWT_SECRET!);
    await jwtVerify(token, secret);
  } catch {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }

  const { id } = await params;

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const parsed = PatchLoteSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten() }, { status: 400 });
  }

  const { precoCidadao, ativo, dataInicio, dataFim } = parsed.data;

  // Se ativando este lote, desativar os outros
  if (ativo === true) {
    await prisma.lote.updateMany({
      where: { id: { not: id } },
      data: { ativo: false },
    });
  }

  const lote = await prisma.lote.update({
    where: { id },
    data: {
      ...(precoCidadao !== undefined ? { precoCidadao } : {}),
      ...(ativo !== undefined ? { ativo } : {}),
      ...(dataInicio !== undefined ? { dataInicio: new Date(dataInicio) } : {}),
      ...(dataFim !== undefined ? { dataFim: new Date(dataFim) } : {}),
    },
  });

  return NextResponse.json(lote);
}
