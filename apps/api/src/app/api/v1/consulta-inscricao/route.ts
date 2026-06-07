import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@corrida/db";
import { InscricaoSchema } from "@corrida/validations";
import { z } from "zod";

const ConsultaInscricaoSchema = z.object({
  numeroPedido: z
    .string()
    .trim()
    .regex(/^PC-2026-\d{6}$/i, "Número do pedido inválido")
    .transform((value) => value.toUpperCase()),
  email: z.string().trim().email("E-mail inválido").toLowerCase(),
});

const RascunhoInscricoesSchema = z.array(InscricaoSchema).min(1).max(5);

export async function POST(req: NextRequest) {
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const parsed = ConsultaInscricaoSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { numeroPedido, email } = parsed.data;

  const pedido = await prisma.pedido.findUnique({
    where: { numeroPedido },
    select: {
      id: true,
      numeroPedido: true,
      status: true,
      metodoPagamento: true,
      total: true,
      expiresAt: true,
      updatedAt: true,
      participantes: {
        select: {
          id: true,
          nome: true,
          email: true,
          numeroPeito: true,
          categoria: { select: { id: true, nome: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      rascunho: {
        select: { inscricoesJson: true },
      },
    },
  });

  if (!pedido) {
    return NextResponse.json(
      { error: "Pedido não encontrado para os dados informados" },
      { status: 404 }
    );
  }

  const emailMatchesParticipante = pedido.participantes.some(
    (participante) => participante.email.toLowerCase() === email
  );

  if (pedido.participantes.length > 0) {
    if (!emailMatchesParticipante) {
      return NextResponse.json(
        { error: "Pedido não encontrado para os dados informados" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      numeroPedido: pedido.numeroPedido,
      status: pedido.status,
      metodoPagamento: pedido.metodoPagamento,
      total: pedido.total,
      expiresAt: pedido.expiresAt?.toISOString() ?? null,
      updatedAt: pedido.updatedAt.toISOString(),
      participantes: pedido.participantes.map((participante) => ({
        nome: participante.nome,
        categoria: participante.categoria.nome,
        numeroPeito: participante.numeroPeito,
      })),
    });
  }

  if (!pedido.rascunho) {
    return NextResponse.json(
      { error: "Pedido não encontrado para os dados informados" },
      { status: 404 }
    );
  }

  let inscricoesRaw: unknown;
  try {
    inscricoesRaw = JSON.parse(pedido.rascunho.inscricoesJson);
  } catch {
    return NextResponse.json(
      { error: "Dados temporários do pedido inválidos" },
      { status: 422 }
    );
  }

  const parsedRascunho = RascunhoInscricoesSchema.safeParse(inscricoesRaw);
  if (!parsedRascunho.success) {
    return NextResponse.json(
      { error: "Dados temporários do pedido inválidos" },
      { status: 422 }
    );
  }

  const inscricoes = parsedRascunho.data;
  const emailMatchesRascunho = inscricoes.some(
    (inscricao) => inscricao.email.toLowerCase() === email
  );

  if (!emailMatchesRascunho) {
    return NextResponse.json(
      { error: "Pedido não encontrado para os dados informados" },
      { status: 404 }
    );
  }

  const categorias = await prisma.categoria.findMany({
    where: { id: { in: [...new Set(inscricoes.map((i) => i.categoriaId))] } },
    select: { id: true, nome: true },
  });
  const categoriaPorId = new Map(categorias.map((categoria) => [categoria.id, categoria.nome]));

  return NextResponse.json({
    numeroPedido: pedido.numeroPedido,
    status: pedido.status,
    metodoPagamento: pedido.metodoPagamento,
    total: pedido.total,
    expiresAt: pedido.expiresAt?.toISOString() ?? null,
    updatedAt: pedido.updatedAt.toISOString(),
    participantes: inscricoes.map((inscricao) => ({
      nome: inscricao.nome,
      categoria: categoriaPorId.get(inscricao.categoriaId) ?? "Categoria não encontrada",
      numeroPeito: null,
    })),
  });
}
