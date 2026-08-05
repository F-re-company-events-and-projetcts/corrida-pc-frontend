import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@corrida/db";
import { z } from "zod";

const TAMANHOS = ["PP", "P", "M", "G", "GG", "XGG"] as const;

const PatchSchema = z.object({
  nome: z.string().min(3).optional(),
  email: z.string().email().optional(),
  telefone: z.string().min(10).regex(/^\d+$/).optional(),
  contatoEmergencia: z.string().min(3).optional(),
  tamanhoCamiseta: z.enum(TAMANHOS).optional(),
  numeroPeito: z.number().int().positive().nullable().optional(),
  checkinRealizadoEm: z.string().datetime().nullable().optional(),
});

function getToken(req: NextRequest): string | null {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  return auth.slice(7);
}

async function verifyJWT(token: string) {
  const secret = new TextEncoder().encode(process.env.ADMIN_JWT_SECRET!);
  const { payload } = await jwtVerify(token, secret);
  return payload as { adminId: string; email: string; role: string };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = getToken(req);
  if (!token) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    await verifyJWT(token);
  } catch {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }

  const { id } = await params;

  const participante = await prisma.participante.findUnique({
    where: { id },
    select: {
      id: true,
      nome: true,
      email: true,
      telefone: true,
      contatoEmergencia: true,
      dataNascimento: true,
      tamanhoCamiseta: true,
      numeroPeito: true,
      checkinRealizadoEm: true,
      createdAt: true,
      categoria: { select: { id: true, nome: true, percursoKm: true, tipo: true } },
      pedido: {
        select: {
          id: true,
          numeroPedido: true,
          status: true,
          metodoPagamento: true,
          total: true,
        },
      },
    },
  });

  if (!participante) {
    return NextResponse.json({ error: "Participante não encontrado" }, { status: 404 });
  }

  return NextResponse.json({
    ...participante,
    dataNascimento: participante.dataNascimento.toISOString(),
    checkinRealizadoEm: participante.checkinRealizadoEm?.toISOString() ?? null,
    createdAt: participante.createdAt.toISOString(),
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = getToken(req);
  if (!token) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  let adminPayload: { adminId: string; email: string; role: string };
  try {
    adminPayload = await verifyJWT(token);
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

  const parsed = PatchSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten() }, { status: 400 });
  }

  const updates = parsed.data;
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nenhum campo para atualizar" }, { status: 400 });
  }

  const before = await prisma.participante.findUnique({
    where: { id },
    select: {
      nome: true, email: true, telefone: true, contatoEmergencia: true,
      tamanhoCamiseta: true, numeroPeito: true, checkinRealizadoEm: true,
    },
  });
  if (!before) return NextResponse.json({ error: "Participante não encontrado" }, { status: 404 });

  const { checkinRealizadoEm: checkinStr, ...restUpdates } = updates;

  const prismaData = {
    ...restUpdates,
    ...(checkinStr !== undefined
      ? { checkinRealizadoEm: checkinStr ? new Date(checkinStr) : null }
      : {}),
  };

  const updated = await prisma.participante.update({
    where: { id },
    data: prismaData,
    select: {
      id: true, nome: true, email: true, telefone: true,
      contatoEmergencia: true, tamanhoCamiseta: true,
      numeroPeito: true, checkinRealizadoEm: true,
    },
  });

  // Determinar ação de log
  const isCheckin = checkinStr !== undefined;
  const acao = isCheckin
    ? checkinStr
      ? "REGISTRAR_CHECKIN"
      : "REMOVER_CHECKIN"
    : "EDITAR_PARTICIPANTE";

  if (isCheckin) {
    await prisma.adminLog.create({
      data: {
        adminId: adminPayload.adminId,
        acao,
        entidade: "Participante",
        entidadeId: id,
        valorAnterior: before.checkinRealizadoEm?.toISOString() ?? "",
        valorNovo: checkinStr ?? "",
      },
    });
  } else {
    const campos = Object.keys(restUpdates) as (keyof typeof restUpdates)[];
    await Promise.all(
      campos.map((campo) =>
        prisma.adminLog.create({
          data: {
            adminId: adminPayload.adminId,
            acao,
            entidade: "Participante",
            entidadeId: id,
            valorAnterior: String(before[campo] ?? ""),
            valorNovo: String(restUpdates[campo] ?? ""),
          },
        })
      )
    );
  }

  return NextResponse.json({
    ...updated,
    checkinRealizadoEm: updated.checkinRealizadoEm?.toISOString() ?? null,
  });
}
