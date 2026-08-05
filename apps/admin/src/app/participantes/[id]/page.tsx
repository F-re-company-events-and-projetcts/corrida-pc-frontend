import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { AdminNav } from "@/components/AdminNav";
import { EditParticipanteForm } from "./EditParticipanteForm";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

async function fetchParticipante(token: string, id: string) {
  const res = await fetch(`${API_URL}/api/v1/admin/participantes/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (res.status === 401) return null;
  if (res.status === 404) return "not_found" as const;
  if (!res.ok) throw new Error("Falha ao buscar participante");
  return res.json();
}

export default async function ParticipanteDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) redirect("/login");

  const data = await fetchParticipante(token, id);
  if (data === null) redirect("/login");
  if (data === "not_found") notFound();

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav active="/participantes" />

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <a href="/participantes" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
            ← Participantes
          </a>
          <span className="text-gray-300">/</span>
          <h2 className="text-2xl font-bold text-gray-900">{data.nome}</h2>
        </div>

        <EditParticipanteForm initial={data} />
      </main>
    </div>
  );
}
