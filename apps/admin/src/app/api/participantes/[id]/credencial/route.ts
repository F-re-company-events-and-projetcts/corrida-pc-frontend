import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// POST /api/participantes/[id]/credencial
// Proxy httpOnly → apps/api POST /api/v1/admin/participantes/[id]/credencial
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

  const res = await fetch(
    `${apiUrl}/api/v1/admin/participantes/${id}/credencial`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
