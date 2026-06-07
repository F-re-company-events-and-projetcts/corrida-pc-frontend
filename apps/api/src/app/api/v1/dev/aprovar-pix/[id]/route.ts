import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma, Prisma } from "@corrida/db";
import { InscricaoSchema } from "@corrida/validations";
import { sendConfirmacaoEmail } from "@corrida/email";
import { z } from "zod";

const InscricoesSchema = z.array(InscricaoSchema).min(1).max(5);

function isAuthorized(req: NextRequest) {
  const expectedSecret = process.env.DEV_PAYMENT_SIMULATION_SECRET ?? "dev-local";
  return req.headers.get("x-dev-payment-secret") === expectedSecret;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Simulador de pagamento indisponível em produção" },
      { status: 404 }
    );
  }

  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;

  const pedido = await prisma.pedido.findUnique({
    where: { id },
    include: { rascunho: true, pagamento: true },
  });

  if (!pedido) {
    return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
  }

  if (pedido.status === "PAGO") {
    return NextResponse.json({ ok: true, pedidoId: id, status: pedido.status });
  }

  if (pedido.metodoPagamento !== "PIX") {
    return NextResponse.json(
      { error: "Este simulador só aprova pedidos PIX" },
      { status: 409 }
    );
  }

  if (pedido.status !== "AGUARDANDO_PAGAMENTO") {
    return NextResponse.json(
      { error: "Pedido não está aguardando pagamento", status: pedido.status },
      { status: 409 }
    );
  }

  if (!pedido.rascunho) {
    return NextResponse.json(
      { error: "Rascunho do pedido não encontrado" },
      { status: 409 }
    );
  }

  let inscricoesRaw: unknown;
  try {
    inscricoesRaw = JSON.parse(pedido.rascunho.inscricoesJson);
  } catch {
    return NextResponse.json(
      { error: "Rascunho do pedido inválido" },
      { status: 422 }
    );
  }

  const parsedInscricoes = InscricoesSchema.safeParse(inscricoesRaw);
  if (!parsedInscricoes.success) {
    return NextResponse.json(
      { error: "Dados do rascunho inválidos", details: parsedInscricoes.error.flatten() },
      { status: 422 }
    );
  }

  const inscricoes = parsedInscricoes.data;
  const paymentIdGateway = `DEV-${id}`;

  const existingPayment = await prisma.pagamento.findUnique({
    where: { paymentIdGateway },
  });

  if (existingPayment) {
    return NextResponse.json({ ok: true, pedidoId: id, status: "PAGO" });
  }

  const cpfHashes = await Promise.all(
    inscricoes.map((i) => bcrypt.hash(i.cpf.replace(/\D/g, ""), 10))
  );

  const countPerCategory = inscricoes.reduce<Record<string, number>>(
    (acc, i) => {
      acc[i.categoriaId] = (acc[i.categoriaId] ?? 0) + 1;
      return acc;
    },
    {}
  );

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    for (const [idx, inscricao] of inscricoes.entries()) {
      await tx.participante.create({
        data: {
          nome: inscricao.nome,
          cpf: cpfHashes[idx],
          dataNascimento: new Date(inscricao.dataNascimento),
          telefone: inscricao.telefone,
          email: inscricao.email,
          contatoEmergencia: inscricao.contatoEmergencia,
          tamanhoCamiseta: inscricao.tamanhoCamiseta,
          categoriaId: inscricao.categoriaId,
          pedidoId: id,
        },
      });
    }

    await tx.pagamento.create({
      data: {
        pedidoId: id,
        paymentIdGateway,
        valor: pedido.total,
        metodo: "PIX",
        status: "approved_dev",
        webhookRecebidoEm: new Date(),
      },
    });

    await tx.pedido.update({
      where: { id },
      data: { status: "PAGO", paymentId: paymentIdGateway },
    });

    for (const [categoriaId, count] of Object.entries(countPerCategory)) {
      await tx.categoria.update({
        where: { id: categoriaId },
        data: { vagasOcupadas: { increment: count } },
      });
    }

    await tx.pedidoRascunho.delete({ where: { pedidoId: id } });
  });

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
      console.error("[dev/aprovar-pix] Failed to send confirmation email:", err);
    }
  })();

  return NextResponse.json({ ok: true, pedidoId: id, status: "PAGO" });
}
