import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@corrida/db";
import { z } from "zod";

function getToken(req: NextRequest): string | null {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  return auth.slice(7);
}

const CHAVES_PERMITIDAS = ["PRECO_POLICIAL", "TAXA_SERVICO_PCT"] as const;

const PatchSchema = z.object({
  PRECO_POLICIAL: z.coerce.number().positive().optional(),
  TAXA_SERVICO_PCT: z.coerce.number().min(0).max(100).optional(),
});

export async function GET(req: NextRequest) {
  const token = getToken(req);
  if (!token) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const secret = new TextEncoder().encode(process.env.ADMIN_JWT_SECRET!);
    await jwtVerify(token, secret);
  } catch {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }

  const configs = await prisma.configuracao.findMany({
    where: { chave: { in: [...CHAVES_PERMITIDAS] } },
  });

  const result: Record<string, string> = {};
  for (const c of configs) result[c.chave] = c.valor;

  // Fallback para env vars se não existir no banco
  if (!result.PRECO_POLICIAL) result.PRECO_POLICIAL = process.env.PRECO_POLICIAL ?? "80";
  if (!result.TAXA_SERVICO_PCT) result.TAXA_SERVICO_PCT = process.env.TAXA_SERVICO_PCT ?? "10";

  return NextResponse.json(result);
}

export async function PATCH(req: NextRequest) {
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

  const parsed = PatchSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten() }, { status: 400 });
  }

  const updates = parsed.data;
  const now = new Date();

  await Promise.all(
    Object.entries(updates)
      .filter(([, v]) => v !== undefined)
      .map(([chave, valor]) =>
        prisma.configuracao.upsert({
          where: { chave },
          update: { valor: String(valor), updatedAt: now },
          create: { chave, valor: String(valor), updatedAt: now },
        })
      )
  );

  return NextResponse.json({ ok: true });
}
