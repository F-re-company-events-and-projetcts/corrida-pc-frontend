import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

async function getToken() {
  const cookieStore = await cookies();
  return cookieStore.get("admin_token")?.value ?? null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export async function GET() {
  const token = await getToken();
  if (!token) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const res = await fetch(`${API_URL}/api/v1/admin/configuracoes`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function PATCH(req: NextRequest) {
  const token = await getToken();
  if (!token) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const res = await fetch(`${API_URL}/api/v1/admin/configuracoes`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
