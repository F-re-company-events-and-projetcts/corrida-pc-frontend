import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@corrida/db";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { z } from "zod";

// ─── Rate limiting ────────────────────────────────────────────────────────────

const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60_000;

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

// ─── Schema ───────────────────────────────────────────────────────────────────

const LoginSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(1),
});

// ─── POST /api/v1/admin/auth ──────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const ip = getClientIP(req);
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Muitas tentativas. Aguarde 15 minutos." },
      { status: 429 }
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const parsed = LoginSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const { email, senha } = parsed.data;

  const admin = await prisma.adminUser.findUnique({ where: { email } });

  const senhaValida =
    admin !== null && (await bcrypt.compare(senha, admin.senha));

  if (!admin || !senhaValida) {
    return NextResponse.json(
      { error: "Credenciais inválidas" },
      { status: 401 }
    );
  }

  const secret = new TextEncoder().encode(process.env.ADMIN_JWT_SECRET!);

  const token = await new SignJWT({
    adminId: admin.id,
    email: admin.email,
    role: admin.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secret);

  return NextResponse.json({ token }, { status: 200 });
}
