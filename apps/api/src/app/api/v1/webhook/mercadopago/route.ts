import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import MercadoPago, { Payment } from "mercadopago";
import { z } from "zod";
import { prisma } from "@corrida/db";
import { InscricaoSchema } from "@corrida/validations";
import { sendConfirmacaoEmail } from "@corrida/email";

const mp = new MercadoPago({ accessToken: process.env.MP_ACCESS_TOKEN! });

const InscricoesSchema = z.array(InscricaoSchema);

function validarAssinatura(
  xSignature: string,
  xRequestId: string,
  dataId: string
): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) return false;

  const parts = xSignature.split(",");
  const tsPart = parts[0]; // "ts=TIMESTAMP"
  const v1Part = parts[1]; // "v1=HASH"
  if (!tsPart || !v1Part) return false;

  const ts = tsPart.split("=")[1];
  const received = v1Part.split("=")[1];
  if (!ts || !received) return false;

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const hash = crypto
    .createHmac("sha256", secret)
    .update(manifest)
    .digest("hex");

  if (hash.length !== received.length) return false;
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(received));
}

export async function POST(req: NextRequest) {
  const xSignature = req.headers.get("x-signature") ?? "";
  const xRequestId = req.headers.get("x-request-id") ?? "";
  const dataId = req.nextUrl.searchParams.get("data.id") ?? "";

  if (!validarAssinatura(xSignature, xRequestId, dataId)) {
    return NextResponse.json({ error: "Assinatura inválida" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  // Only process payment events
  if (
    typeof body !== "object" ||
    body === null ||
    (body as Record<string, unknown>).type !== "payment"
  ) {
    return NextResponse.json({ ok: true });
  }

  // Fetch payment details from Mercado Pago
  let paymentData: Awaited<ReturnType<InstanceType<typeof Payment>["get"]>>;
  try {
    paymentData = await new Payment(mp).get({ id: Number(dataId) });
  } catch (err) {
    console.error("[webhook] Failed to fetch payment:", err);
    return NextResponse.json(
      { error: "Erro ao buscar pagamento" },
      { status: 502 }
    );
  }

  // Only process approved payments
  if (paymentData.status !== "approved") {
    return NextResponse.json({ ok: true });
  }

  const paymentIdGateway = String(paymentData.id);
  const pedidoId = paymentData.external_reference;

  if (!pedidoId) {
    console.error("[webhook] Payment has no external_reference:", paymentIdGateway);
    return NextResponse.json({ ok: true });
  }

  // Idempotency: if already processed, return 200 silently
  const existing = await prisma.pagamento.findUnique({
    where: { paymentIdGateway },
  });
  if (existing) {
    return NextResponse.json({ ok: true });
  }

  // Fetch draft order with registrant data (only exists for PIX)
  const rascunho = await prisma.pedidoRascunho.findUnique({
    where: { pedidoId },
  });
  if (!rascunho) {
    console.error("[webhook] PedidoRascunho not found for pedidoId:", pedidoId);
    return NextResponse.json({ ok: true });
  }

  // Deserialize and validate registrants
  let inscricoesRaw: unknown;
  try {
    inscricoesRaw = JSON.parse(rascunho.inscricoesJson);
  } catch {
    console.error("[webhook] Failed to parse inscricoesJson for pedidoId:", pedidoId);
    return NextResponse.json({ ok: true });
  }

  const parsedInscricoes = InscricoesSchema.safeParse(inscricoesRaw);
  if (!parsedInscricoes.success) {
    console.error("[webhook] Invalid inscricoes data for pedidoId:", pedidoId);
    return NextResponse.json({ ok: true });
  }

  const inscricoes = parsedInscricoes.data;

  const pedido = await prisma.pedido.findUnique({ where: { id: pedidoId } });
  if (!pedido) {
    console.error("[webhook] Pedido not found:", pedidoId);
    return NextResponse.json({ ok: true });
  }

  // Hash CPFs before persisting — never store plain text
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

  try {
    await prisma.$transaction(async (tx) => {
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
            pedidoId,
          },
        });
      }

      await tx.pagamento.create({
        data: {
          pedidoId,
          paymentIdGateway,
          valor: pedido.total,
          metodo: "PIX",
          status: "approved",
          webhookRecebidoEm: new Date(),
        },
      });

      await tx.pedido.update({
        where: { id: pedidoId },
        data: { status: "PAGO", paymentId: paymentIdGateway },
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

      await tx.pedidoRascunho.delete({ where: { pedidoId } });
    });
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("VAGA_INDISPONIVEL")) {
      console.error(
        `[webhook] PIX aprovado mas sem vagas: pedidoId=${pedidoId} paymentId=${paymentIdGateway} — ${err.message}`
      );
      // Retorna 200 para o MP não retentar; situação requer tratamento manual (reembolso)
      return NextResponse.json({ ok: true });
    }
    throw err;
  }

  console.log(
    `[webhook] PIX confirmed: pedidoId=${pedidoId}, paymentId=${paymentIdGateway}`
  );

  // Fire-and-forget: fetch participantes and send confirmation email
  void (async () => {
    try {
      const participantes = await prisma.participante.findMany({
        where: { pedidoId },
        include: { categoria: true },
        orderBy: { createdAt: "asc" },
      });
      const destinatario = participantes[0]?.email;
      if (destinatario) {
        await sendConfirmacaoEmail({
          pedidoId,
          numeroPedido: pedido.numeroPedido,
          email: destinatario,
          total: pedido.total,
          participantes: participantes.map((p) => ({
            nome: p.nome,
            categoria: p.categoria.nome,
            percursoKm: p.categoria.percursoKm,
          })),
        });
      }
    } catch (err) {
      console.error("[webhook] Failed to send confirmation email:", err);
    }
  })();

  return NextResponse.json({ ok: true });
}
