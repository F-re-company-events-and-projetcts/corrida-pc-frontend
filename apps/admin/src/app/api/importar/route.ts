import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Esperado multipart/form-data" }, { status: 400 });
  }

  const file = formData.get("planilha");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Campo 'planilha' ausente" }, { status: 400 });
  }

  const upstream = new FormData();
  upstream.append("planilha", file);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  const res = await fetch(`${apiUrl}/api/v1/admin/importar-numeros`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: upstream,
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
