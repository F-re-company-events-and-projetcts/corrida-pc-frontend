import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@corrida/db";

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

// POST /api/v1/admin/participantes/[id]/credencial
// Registra a retirada do kit de credenciamento (26/09)
export async function POST(
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

  const participante = await prisma.participante.findUnique({
    where: { id },
    select: {
      id: true,
      nome: true,
      credencialRetiradaEm: true,
      pedido: { select: { status: true } },
    },
  });

  if (!participante) {
    return NextResponse.json({ error: "Participante não encontrado" }, { status: 404 });
  }

  if (participante.pedido.status !== "PAGO") {
    return NextResponse.json(
      { error: "Credenciamento indisponível: pagamento não confirmado." },
      { status: 422 }
    );
  }

  if (participante.credencialRetiradaEm) {
    return NextResponse.json(
      {
        error: "Credencial já retirada.",
        nome: participante.nome,
        credencialRetiradaEm: participante.credencialRetiradaEm.toISOString(),
      },
      { status: 409 }
    );
  }

  const agora = new Date();

  const updated = await prisma.participante.update({
    where: { id },
    data: { credencialRetiradaEm: agora },
    select: {
      id: true,
      nome: true,
      tamanhoCamiseta: true,
      numeroPeito: true,
      credencialRetiradaEm: true,
      categoria: { select: { id: true, nome: true, percursoKm: true, tipo: true } },
    },
  });

  await prisma.adminLog.create({
    data: {
      adminId: adminPayload.adminId,
      acao: "REGISTRAR_CREDENCIAL",
      entidade: "Participante",
      entidadeId: id,
      valorAnterior: "",
      valorNovo: agora.toISOString(),
    },
  });

  return NextResponse.json({
    ...updated,
    credencialRetiradaEm: updated.credencialRetiradaEm?.toISOString() ?? null,
  });
}
