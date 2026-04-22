import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { z } from "zod";

const BodySchema = z.object({ token: z.string().min(1) });

const COOKIE_MAX_AGE = 8 * 60 * 60; // 8h in seconds

export async function POST(req: NextRequest) {
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: "Token ausente" }, { status: 400 });
  }

  const { token } = parsed.data;

  try {
    const secret = new TextEncoder().encode(process.env.ADMIN_JWT_SECRET!);
    await jwtVerify(token, secret);
  } catch {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("admin_token", token, {
    httpOnly: true,
    sameSite: "strict",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
