import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import MercadoPago, { Payment } from "mercadopago";
import { prisma, Prisma } from "@corrida/db";
import { InscricaoSchema } from "@corrida/validations";
import { sendConfirmacaoEmail } from "@corrida/email";
import { criptografarCpf } from "@/lib/cpf-crypto";

const CardPaymentSchema = z.object({
  token: z.string().min(1),
  installments: z.coerce.number().int().min(1).max(12),
  issuerId: z.coerce.string().optional(),
  paymentMethodId: z.string().min(1),
  inscricoes: z.array(InscricaoSchema).min(1).max(5),
});

const mp = new MercadoPago({ accessToken: process.env.MP_ACCESS_TOKEN! });

const REJECTION_MESSAGES: Record<string, string> = {
  cc_rejected_insufficient_amount: "Saldo insuficiente no cartão.",
  cc_rejected_bad_filled_card_number: "Número do cartão incorreto.",
  cc_rejected_bad_filled_security_code: "Código de segurança incorreto.",
  cc_rejected_bad_filled_date: "Data de validade incorreta.",
  cc_rejected_high_risk: "Pagamento recusado por segurança. Tente outro cartão.",
  cc_rejected_call_for_authorize:
    "Contacte seu banco para autorizar o pagamento e tente novamente.",
  cc_rejected_duplicated_payment: "Pagamento duplicado detectado.",
  cc_rejected_card_disabled:
    "Cartão desabilitado — entre em contato com seu banco.",
};

function rejectionMessage(statusDetail: string): string {
  return (
    REJECTION_MESSAGES[statusDetail] ??
    "Pagamento recusado. Verifique os dados e tente novamente."
  );
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const pedido = await prisma.pedido.findUnique({ where: { id } });

  if (!pedido) {
    return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
  }
  if (pedido.metodoPagamento !== "CARTAO") {
    return NextResponse.json(
      { error: "Este pedido não é de cartão de crédito" },
      { status: 409 }
    );
  }
  if (pedido.status !== "AGUARDANDO_PAGAMENTO") {
    return NextResponse.json(
      { error: "Pedido não está aguardando pagamento" },
      { status: 409 }
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const parsed = CardPaymentSchema.safeParse(rawBody);
  if (!parsed.success) {
    console.warn("[cartao] Invalid request body:", parsed.error.flatten());
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { token, installments, issuerId, paymentMethodId, inscricoes } =
    parsed.data;

  // Process card payment via Mercado Pago
  let payment;
  try {
    payment = await new Payment(mp).create({
      body: {
        transaction_amount: pedido.total,
        token,
        installments,
        payment_method_id: paymentMethodId,
        issuer_id: issuerId ? parseInt(issuerId, 10) : undefined,
        payer: { email: inscricoes[0].email },
        external_reference: pedido.id,
        description: `Inscrição Corrida PC — Pedido ${pedido.numeroPedido}`,
        statement_descriptor: "CORRIDA PC",
      },
    });
  } catch (err) {
    console.error("[cartao] MP payment error:", err);
    return NextResponse.json(
      { error: "Erro ao comunicar com o gateway de pagamento. Tente novamente." },
      { status: 502 }
    );
  }

  if (payment.status !== "approved") {
    const detail = payment.status_detail ?? "rejected";
    return NextResponse.json(
      { error: rejectionMessage(detail), statusDetail: detail },
      { status: 402 }
    );
  }

  const paymentIdStr = String(payment.id);

  // Hash CPFs before persisting (bcrypt, salt 10 — never store plain text)
  const cpfHashes = await Promise.all(
    inscricoes.map((i) => bcrypt.hash(i.cpf.replace(/\D/g, ""), 10))
  );

  // Count inscricoes per category for vagasOcupadas increment
  const countPerCategory = inscricoes.reduce<Record<string, number>>(
    (acc, i) => {
      acc[i.categoriaId] = (acc[i.categoriaId] ?? 0) + 1;
      return acc;
    },
    {}
  );

  try {
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
            contatoEmergencia: inscricao.contatoEmergencia ?? "",
            sexo: inscricao.sexo,
            grupoCorrida: inscricao.grupoCorrida ?? null,
            tamanhoCamiseta: inscricao.tamanhoCamiseta,
            categoriaId: inscricao.categoriaId,
            pedidoId: id,
          },
        });
      }

      await tx.pagamento.create({
        data: {
          pedidoId: id,
          paymentIdGateway: paymentIdStr,
          valor: pedido.total,
          metodo: "CARTAO",
          status: "approved",
        },
      });

      await tx.pedido.update({
        where: { id },
        data: { status: "PAGO", paymentId: paymentIdStr },
      });

      for (const [categoriaId, count] of Object.entries(countPerCategory)) {
        const updated = await tx.$executeRaw`
          UPDATE "Categoria"
          SET "vagasOcupadas" = "vagasOcupadas" + ${count}
          WHERE "id" = ${categoriaId}
          AND ("vagasOcupadas" + ${count}) <= "vagasTotal"
        `;
        if (updated === 0) {
          throw new Error(`VAGA_INDISPONIVEL:${categoriaId}`);
        }
      }
    });
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("VAGA_INDISPONIVEL")) {
      console.error(
        `[cartao] Cartão aprovado mas sem vagas: pedidoId=${id} paymentId=${paymentIdStr} — ${err.message}`
      );
      return NextResponse.json(
        { error: "Vagas esgotadas durante o processamento. Entre em contato com a organização." },
        { status: 409 }
      );
    }
    throw err;
  }

  // Fire-and-forget: fetch participantes and send confirmation email
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
      console.error("[cartao] Failed to send confirmation email:", err);
    }
  })();

  return NextResponse.json({ ok: true, pedidoId: id, numeroPedido: pedido.numeroPedido });
}
