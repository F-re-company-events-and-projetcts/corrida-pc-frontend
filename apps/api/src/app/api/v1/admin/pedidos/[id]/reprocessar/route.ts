import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma, Prisma } from "@corrida/db";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { InscricaoSchema } from "@corrida/validations";
import { criptografarCpf } from "@/lib/cpf-crypto";
import { sendConfirmacaoEmail } from "@corrida/email";

const InscricoesSchema = z.array(InscricaoSchema).min(1).max(5);

function getToken(req: NextRequest): string | null {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  return auth.slice(7);
}

/**
 * POST /api/v1/admin/pedidos/[id]/reprocessar
 *
 * Reprocessa um pedido PIX que foi aprovado no Mercado Pago
 * mas cujos participantes não foram criados (ex: erro no webhook).
 * Lê o PedidoRascunho, cria os participantes e marca o pedido como PAGO.
 * Requer: pedido.status = AGUARDANDO_PAGAMENTO e rascunho existente.
 */
export async function POST(
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

  const pedido = await prisma.pedido.findUnique({
    where: { id },
    include: { rascunho: true, pagamento: true, participantes: true },
  });

  if (!pedido) return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });

  if (pedido.participantes.length > 0) {
    return NextResponse.json(
      { error: "Este pedido já tem participantes criados.", participantes: pedido.participantes.length },
      { status: 409 }
    );
  }

  if (pedido.status === "PAGO" && pedido.participantes.length === 0) {
    // Pedido marcado como pago mas sem participantes — tenta com rascunho
  } else if (pedido.status !== "AGUARDANDO_PAGAMENTO") {
    return NextResponse.json(
      { error: `Status inválido para reprocessamento: ${pedido.status}` },
      { status: 409 }
    );
  }

  if (!pedido.rascunho) {
    return NextResponse.json(
      { error: "Rascunho do pedido não encontrado. Não é possível recriar os participantes." },
      { status: 404 }
    );
  }

  let inscricoesRaw: unknown;
  try {
    inscricoesRaw = JSON.parse(pedido.rascunho.inscricoesJson);
  } catch {
    return NextResponse.json({ error: "Rascunho inválido" }, { status: 422 });
  }

  const parsed = InscricoesSchema.safeParse(inscricoesRaw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados do rascunho inválidos", details: parsed.error.flatten() }, { status: 422 });
  }

  const inscricoes = parsed.data;

  const cpfHashes = await Promise.all(
    inscricoes.map((i) => bcrypt.hash(i.cpf.replace(/\D/g, ""), 10))
  );

  const countPerCategory = inscricoes.reduce<Record<string, number>>((acc: Record<string, number>, i) => {
    acc[i.categoriaId] = (acc[i.categoriaId] ?? 0) + 1;
    return acc;
  }, {});

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    for (const [idx, inscricao] of inscricoes.entries()) {
      await tx.participante.create({
        data: {
          nome: inscricao.nome,
          cpf: cpfHashes[idx],
          cpfCriptografado: criptografarCpf(inscricao.cpf),
          dataNascimento: new Date(inscricao.dataNascimento),
          telefone: inscricao.telefone,
          email: inscricao.email,
          contatoEmergencia: inscricao.contatoEmergencia,
          sexo: inscricao.sexo,
          grupoCorrida: inscricao.grupoCorrida ?? null,
          tamanhoCamiseta: inscricao.tamanhoCamiseta,
          categoriaId: inscricao.categoriaId,
          pedidoId: id,
        },
      });
    }

    if (pedido.status !== "PAGO") {
      await tx.pedido.update({ where: { id }, data: { status: "PAGO" } });
    }

    for (const [categoriaId, count] of Object.entries(countPerCategory)) {
      await tx.$executeRaw`
        UPDATE "Categoria"
        SET "vagasOcupadas" = "vagasOcupadas" + ${count}
        WHERE "id" = ${categoriaId}
      `;
    }

    await tx.pedidoRascunho.delete({ where: { pedidoId: id } });
  });

  // Enviar e-mail de confirmação
  void (async () => {
    try {
      const participantes = await prisma.participante.findMany({
        where: { pedidoId: id },
        include: { categoria: true },
        orderBy: { createdAt: "asc" },
      });
      const destinatario = participantes[0]?.email;
      if (destinatario) {
        await sendConfirmacaoEmail({
          pedidoId: id,
          numeroPedido: pedido.numeroPedido,
          email: destinatario,
          total: pedido.total,
          participantes: participantes.map((p: (typeof participantes)[number]) => ({
            nome: p.nome,
            categoria: p.categoria.nome,
            percursoKm: p.categoria.percursoKm,
          })),
        });
      }
    } catch (err) {
      console.error("[reprocessar] Erro ao enviar e-mail:", err);
    }
  })();

  return NextResponse.json({
    ok: true,
    participantesCriados: inscricoes.length,
    numeroPedido: pedido.numeroPedido,
  });
}
