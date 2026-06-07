import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@corrida/db";
import { z } from "zod";

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

const PatchSchema = z.object({
  status: z.enum(["AGUARDANDO_PAGAMENTO", "PAGO", "RECUSADO", "EXPIRADO", "CANCELADO"]),
  motivo: z.string().min(3, "Motivo deve ter no mínimo 3 caracteres"),
});

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

  const pedido = await prisma.pedido.findUnique({
    where: { id },
    select: {
      id: true,
      numeroPedido: true,
      status: true,
      metodoPagamento: true,
      total: true,
      paymentId: true,
      expiresAt: true,
      createdAt: true,
      updatedAt: true,
      participantes: {
        select: {
          id: true,
          nome: true,
          email: true,
          telefone: true,
          tamanhoCamiseta: true,
          numeroPeito: true,
          checkinRealizadoEm: true,
          dataNascimento: true,
          categoria: { select: { id: true, nome: true, percursoKm: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      pagamento: {
        select: { paymentIdGateway: true, valor: true, metodo: true, status: true, webhookRecebidoEm: true },
      },
    },
  });

  if (!pedido) return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });

  return NextResponse.json({
    ...pedido,
    expiresAt: pedido.expiresAt?.toISOString() ?? null,
    createdAt: pedido.createdAt.toISOString(),
    updatedAt: pedido.updatedAt.toISOString(),
    participantes: pedido.participantes.map((p) => ({
      ...p,
      dataNascimento: p.dataNascimento.toISOString(),
      checkinRealizadoEm: p.checkinRealizadoEm?.toISOString() ?? null,
    })),
    pagamento: pedido.pagamento
      ? { ...pedido.pagamento, webhookRecebidoEm: pedido.pagamento.webhookRecebidoEm?.toISOString() ?? null }
      : null,
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = getToken(req);
  if (!token) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  let admin: { adminId: string; email: string; role: string };
  try {
    admin = await verifyJWT(token);
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

  const { status: novoStatus, motivo } = parsed.data;

  const pedido = await prisma.pedido.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      participantes: { select: { categoriaId: true } },
    },
  });

  if (!pedido) return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });

  // Ao cancelar pedido PAGO, devolver vagas atomicamente
  if (pedido.status === "PAGO" && novoStatus === "CANCELADO") {
    const countPerCategory = pedido.participantes.reduce<Record<string, number>>((acc, p) => {
      acc[p.categoriaId] = (acc[p.categoriaId] ?? 0) + 1;
      return acc;
    }, {});

    await prisma.$transaction(async (tx) => {
      await tx.pedido.update({ where: { id }, data: { status: novoStatus } });

      for (const [categoriaId, count] of Object.entries(countPerCategory)) {
        await tx.categoria.update({
          where: { id: categoriaId },
          data: { vagasOcupadas: { decrement: count } },
        });
      }

      await tx.adminLog.create({
        data: {
          adminId: admin.adminId,
          acao: "ALTERAR_STATUS_PEDIDO",
          entidade: "Pedido",
          entidadeId: id,
          valorAnterior: pedido.status,
          valorNovo: `${novoStatus} — ${motivo}`,
        },
      });
    });
  } else {
    await prisma.$transaction([
      prisma.pedido.update({ where: { id }, data: { status: novoStatus } }),
      prisma.adminLog.create({
        data: {
          adminId: admin.adminId,
          acao: "ALTERAR_STATUS_PEDIDO",
          entidade: "Pedido",
          entidadeId: id,
          valorAnterior: pedido.status,
          valorNovo: `${novoStatus} — ${motivo}`,
        },
      }),
    ]);
  }

  const updated = await prisma.pedido.findUnique({
    where: { id },
    select: { id: true, numeroPedido: true, status: true, updatedAt: true },
  });

  return NextResponse.json({ ...updated, updatedAt: updated!.updatedAt.toISOString() });
}
