import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) {
    return new NextResponse("Não autorizado", { status: 401 });
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  const qs = req.nextUrl.search;

  const res = await fetch(
    `${apiUrl}/api/v1/admin/participantes/exportar${qs}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!res.ok) {
    return new NextResponse("Erro ao exportar", { status: res.status });
  }

  const buffer = await res.arrayBuffer();
  const contentType = res.headers.get("content-type") ?? "application/octet-stream";
  const contentDisposition = res.headers.get("content-disposition") ?? "attachment";

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": contentDisposition,
    },
  });
}
