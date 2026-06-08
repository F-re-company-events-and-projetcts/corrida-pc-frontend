import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@corrida/db";
import { CriarPedidoSchema } from "@corrida/validations";
import MercadoPago, { Payment } from "mercadopago";
import { calcularPreco, getConfiguracoesPricing } from "@/lib/pricing";

// ─── Rate limiting (in-memory) ────────────────────────────────────────────────

const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;

function getClientIP(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) ?? [];
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_MAX) return false;
  recent.push(now);
  rateLimitMap.set(ip, recent);
  return true;
}

// ─── Mercado Pago client ──────────────────────────────────────────────────────

const mp = new MercadoPago({ accessToken: process.env.MP_ACCESS_TOKEN! });

// ─── POST /api/v1/inscricao ───────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const ip = getClientIP(req);
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Muitas requisições. Aguarde um momento." },
      { status: 429 }
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const parsed = CriarPedidoSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { inscricoes, metodoPagamento } = parsed.data;
  const now = new Date();

  // Require an active lot to determine CIDADAO pricing
  const loteAtivo = await prisma.lote.findFirst({
    where: {
      ativo: true,
      dataInicio: { lte: now },
      dataFim: { gte: now },
    },
  });

  const { precoPolicial, taxaPct } = await getConfiguracoesPricing();

  if (!loteAtivo) {
    return NextResponse.json(
      { error: "Nenhum lote ativo no momento. Inscrições indisponíveis." },
      { status: 409 }
    );
  }

  // Fetch all referenced categories in one query
  const categoriaIds = [...new Set(inscricoes.map((i) => i.categoriaId))];
  const categorias = await prisma.categoria.findMany({
    where: { id: { in: categoriaIds } },
  });

  const categoryMap = new Map(categorias.map((c) => [c.id, c]));

  // Ensure all categories exist
  for (const inscricao of inscricoes) {
    if (!categoryMap.has(inscricao.categoriaId)) {
      return NextResponse.json(
        { error: `Categoria ${inscricao.categoriaId} não encontrada` },
        { status: 404 }
      );
    }
  }

  // Count inscricoes per category and verify slot availability
  const countPerCategory = new Map<string, number>();
  for (const inscricao of inscricoes) {
    countPerCategory.set(
      inscricao.categoriaId,
      (countPerCategory.get(inscricao.categoriaId) ?? 0) + 1
    );
  }

  for (const [categoriaId, count] of countPerCategory) {
    const cat = categoryMap.get(categoriaId)!;
    const disponivel = cat.vagasTotal - cat.vagasOcupadas;
    if (disponivel < count) {
      return NextResponse.json(
        {
          error: `Categoria "${cat.nome}" não possui vagas suficientes (disponível: ${disponivel}, solicitado: ${count})`,
          categoria: cat.nome,
        },
        { status: 409 }
      );
    }
  }

  // Validar idade mínima por categoria na data do evento (27/09/2026)
  const eventoData = new Date("2026-09-27T12:00:00Z");
  for (const inscricao of inscricoes) {
    const cat = categoryMap.get(inscricao.categoriaId)!;
    const birth = new Date(inscricao.dataNascimento);
    let age = eventoData.getFullYear() - birth.getFullYear();
    if (
      eventoData.getMonth() < birth.getMonth() ||
      (eventoData.getMonth() === birth.getMonth() && eventoData.getDate() < birth.getDate())
    ) age--;
    const minimo = 16; // regulamento: 16 anos mínimo para todas as categorias
    if (age < minimo) {
      return NextResponse.json(
        {
          error: `Para ${cat.nome}, a idade mínima é ${minimo} anos na data do evento (27/09/2026). "${inscricao.nome}" terá ${age} anos.`,
        },
        { status: 400 }
      );
    }
  }

  // Calculate order total (includes service fee from Configuracao table)
  const total = inscricoes.reduce((acc, inscricao) => {
    const cat = categoryMap.get(inscricao.categoriaId)!;
    const preco = calcularPreco(cat.tipo, loteAtivo.precoCidadao, precoPolicial, taxaPct) ?? 0;
    return acc + preco;
  }, 0);

  // PIX expires in 30min; card payments don't need expiration
  const expiresAt =
    metodoPagamento === "PIX"
      ? new Date(now.getTime() + 30 * 60 * 1000)
      : null;

  // Persist the order (participants are created only after payment confirmation)
  const pedido = await prisma.pedido.create({
    data: {
      total,
      status: "AGUARDANDO_PAGAMENTO",
      metodoPagamento,
      expiresAt,
    },
  });

  // For card payments: no PIX generation — frontend calls /inscricao/[id]/cartao next
  if (metodoPagamento === "CARTAO") {
    return NextResponse.json(
      { pedidoId: pedido.id, numeroPedido: pedido.numeroPedido, total },
      { status: 201 }
    );
  }

  // Generate PIX via Mercado Pago
  const primeiroInscrito = inscricoes[0];
  let qrCode: string;
  let qrCodeBase64: string;
  let paymentId: string;

  try {
    const payment = await new Payment(mp).create({
      body: {
        transaction_amount: total,
        payment_method_id: "pix",
        payer: {
          email: primeiroInscrito.email,
          first_name: primeiroInscrito.nome.split(" ")[0],
        },
        date_of_expiration: expiresAt!.toISOString(),
        description: `Inscrição Corrida PC — Pedido ${pedido.numeroPedido}`,
        external_reference: pedido.id,
      },
    });

    const txData = payment.point_of_interaction?.transaction_data;
    if (!txData?.qr_code || !txData?.qr_code_base64) {
      throw new Error("QR Code não retornado pelo Mercado Pago");
    }

    qrCode = txData.qr_code;
    qrCodeBase64 = txData.qr_code_base64;
    paymentId = String(payment.id);
  } catch (err) {
    await prisma.pedido.delete({ where: { id: pedido.id } }).catch(() => {});
    console.error("Erro ao criar pagamento PIX no Mercado Pago:", err);
    return NextResponse.json(
      { error: "Erro ao gerar QR Code PIX. Tente novamente." },
      { status: 502 }
    );
  }

  await prisma.$transaction([
    prisma.pedido.update({
      where: { id: pedido.id },
      data: { paymentId },
    }),
    prisma.pedidoRascunho.create({
      data: {
        pedidoId: pedido.id,
        inscricoesJson: JSON.stringify(inscricoes),
        expiresAt: expiresAt!,
      },
    }),
  ]);

  return NextResponse.json(
    {
      pedidoId: pedido.id,
      numeroPedido: pedido.numeroPedido,
      qrCode,
      qrCodeBase64,
      expiresAt: expiresAt!.toISOString(),
    },
    { status: 201 }
  );
}
