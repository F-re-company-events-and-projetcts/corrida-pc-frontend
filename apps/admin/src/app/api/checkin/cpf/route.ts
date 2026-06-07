import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  const res = await fetch(`${apiUrl}/api/v1/admin/checkin/cpf`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
