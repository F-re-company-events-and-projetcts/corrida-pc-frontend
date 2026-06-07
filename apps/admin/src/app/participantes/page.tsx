import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/AdminNav";
import { CheckinToggle } from "@/components/CheckinToggle";

interface CategoriaInfo {
  nome: string;
  percursoKm: number;
}

interface PedidoInfo {
  id: string;
  numeroPedido: string;
  status: string;
  metodoPagamento: string;
  total: number;
}

interface Participante {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  tamanhoCamiseta: string;
  numeroPeito: number | null;
  checkinRealizadoEm: string | null;
  createdAt: string;
  categoria: CategoriaInfo;
  pedido: PedidoInfo;
}

interface ParticipantesData {
  participantes: Participante[];
  total: number;
  page: number;
  totalPages: number;
}

interface CategoriaFiltro {
  id: string;
  nome: string;
  percursoKm: number;
}

async function fetchParticipantes(
  token: string,
  params: { page: string; categoria: string; status: string; q: string; faixa: string }
): Promise<ParticipantesData | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  const qs = new URLSearchParams({
    page: params.page,
    limit: "20",
    ...(params.categoria ? { categoria: params.categoria } : {}),
    ...(params.status ? { status: params.status } : {}),
    ...(params.q ? { q: params.q } : {}),
    ...(params.faixa ? { faixa: params.faixa } : {}),
  });
  const res = await fetch(`${apiUrl}/api/v1/admin/participantes?${qs}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error(`Participantes fetch failed: ${res.status}`);
  return res.json() as Promise<ParticipantesData>;
}

async function fetchCategorias(token: string): Promise<CategoriaFiltro[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  const res = await fetch(`${apiUrl}/api/v1/admin/dashboard`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { vagasPorCategoria: (CategoriaFiltro & { id: string })[] };
  return data.vagasPorCategoria;
}

const STATUS_LABELS: Record<string, string> = {
  AGUARDANDO_PAGAMENTO: "Aguardando",
  PAGO: "Pago",
  RECUSADO: "Recusado",
  EXPIRADO: "Expirado",
  CANCELADO: "Cancelado",
};

const STATUS_COLORS: Record<string, string> = {
  AGUARDANDO_PAGAMENTO: "bg-amber-100 text-amber-700",
  PAGO: "bg-emerald-100 text-emerald-700",
  RECUSADO: "bg-red-100 text-red-700",
  EXPIRADO: "bg-gray-100 text-gray-500",
  CANCELADO: "bg-red-100 text-red-700",
};

interface PageProps {
  searchParams: Promise<{ page?: string; categoria?: string; status?: string; q?: string; faixa?: string }>;
}

export default async function ParticipantesPage({ searchParams }: PageProps) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) redirect("/login");

  const params = await searchParams;
  const page = params.page ?? "1";
  const categoria = params.categoria ?? "";
  const status = params.status ?? "";
  const q = params.q ?? "";
  const faixa = params.faixa ?? "";

  let data: ParticipantesData;
  let categorias: CategoriaFiltro[];

  try {
    const [dataResult, categoriasResult] = await Promise.all([
      fetchParticipantes(token, { page, categoria, status, q, faixa }),
      fetchCategorias(token),
    ]);
    if (!dataResult) redirect("/login");
    data = dataResult;
    categorias = categoriasResult;
  } catch {
    redirect("/login");
  }

  const buildQuery = (overrides: Record<string, string>) => {
    const next = new URLSearchParams();
    if (page !== "1") next.set("page", page);
    if (categoria) next.set("categoria", categoria);
    if (status) next.set("status", status);
    if (q) next.set("q", q);
    if (faixa) next.set("faixa", faixa);
    for (const [k, v] of Object.entries(overrides)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    const str = next.toString();
    return str ? `?${str}` : "/participantes";
  };

  const prevHref = data.page > 1 ? `/participantes${buildQuery({ page: String(data.page - 1) })}` : null;
  const nextHref = data.page < data.totalPages ? `/participantes${buildQuery({ page: String(data.page + 1) })}` : null;

  const exportQs = new URLSearchParams();
  if (categoria) exportQs.set("categoria", categoria);
  if (status) exportQs.set("status", status);
  if (q) exportQs.set("q", q);
  if (faixa) exportQs.set("faixa", faixa);
  const exportBase = exportQs.toString() ? `?${exportQs.toString()}&` : "?";

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav active="/participantes" />

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">

        <div className="flex items-baseline gap-3">
          <h2 className="text-2xl font-bold text-gray-900">Participantes</h2>
          <span className="text-sm text-gray-400">{data.total} encontrado{data.total !== 1 ? "s" : ""}</span>
        </div>

        {/* Filtros + Exportar */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <form method="GET" action="/participantes" className="flex flex-wrap gap-3">
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Buscar por nome, e-mail ou pedido"
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 flex-1 min-w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              name="categoria"
              defaultValue={categoria}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas as categorias</option>
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nome} ({cat.percursoKm} km)
                </option>
              ))}
            </select>
            <select
              name="status"
              defaultValue={status}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos os status</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <select
              name="faixa"
              defaultValue={faixa}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas as idades</option>
              <option value="menor18">Menores de 18</option>
              <option value="18a29">18 – 29 anos</option>
              <option value="30a39">30 – 39 anos</option>
              <option value="40a49">40 – 49 anos</option>
              <option value="50mais">50 anos ou mais</option>
            </select>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Filtrar
            </button>
            {(q || categoria || status || faixa) && (
              <a
                href="/participantes"
                className="px-4 py-2 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Limpar
              </a>
            )}
            <div className="flex gap-2 ml-auto">
              <a
                href={`/api/exportar${exportBase}format=csv`}
                className="px-4 py-2 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
              >
                CSV
              </a>
              <a
                href={`/api/exportar${exportBase}format=xlsx`}
                className="px-4 py-2 border border-emerald-300 text-sm text-emerald-700 rounded-lg hover:bg-emerald-50 transition-colors"
              >
                XLSX
              </a>
            </div>
          </form>
        </div>

        {/* Tabela */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {data.participantes.length === 0 ? (
            <div className="px-6 py-16 text-center text-sm text-gray-400">
              Nenhum participante encontrado.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Nome</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">E-mail</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Categoria</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Pedido</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Camiseta</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Nº Peito</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Check-in</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.participantes.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-3.5 font-semibold text-gray-900 whitespace-nowrap">
                        <a href={`/participantes/${p.id}`} className="hover:text-blue-600 hover:underline transition-colors">
                          {p.nome}
                        </a>
                      </td>
                      <td className="px-6 py-3.5 text-gray-600 text-sm">{p.email}</td>
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        <p className="text-sm text-gray-800">{p.categoria.nome}</p>
                        <p className="text-xs text-gray-400">{p.categoria.percursoKm} km</p>
                      </td>
                      <td className="px-6 py-3.5">
                        <p className="font-mono text-xs text-gray-500 mb-1">{p.pedido.numeroPedido}</p>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[p.pedido.status] ?? "bg-gray-100 text-gray-500"}`}>
                          {STATUS_LABELS[p.pedido.status] ?? p.pedido.status}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="text-xs font-mono font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                          {p.tamanhoCamiseta}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 font-mono text-sm text-gray-600">
                        {p.numeroPeito != null ? (
                          <span className="font-semibold text-gray-800">#{p.numeroPeito}</span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex flex-col gap-1">
                          <CheckinToggle participanteId={p.id} checkinRealizadoEm={p.checkinRealizadoEm} />
                          {p.checkinRealizadoEm && (
                            <span className="text-xs text-gray-400">
                              {new Date(p.checkinRealizadoEm).toLocaleString("pt-BR", {
                                day: "2-digit", month: "2-digit",
                                hour: "2-digit", minute: "2-digit",
                              })}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Paginação */}
        {data.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Página <span className="font-semibold">{data.page}</span> de {data.totalPages}
            </p>
            <div className="flex gap-2">
              {prevHref ? (
                <a href={prevHref} className="px-4 py-2 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
                  Anterior
                </a>
              ) : (
                <span className="px-4 py-2 border border-gray-100 text-sm text-gray-300 rounded-lg cursor-not-allowed">
                  Anterior
                </span>
              )}
              {nextHref ? (
                <a href={nextHref} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                  Próxima
                </a>
              ) : (
                <span className="px-4 py-2 border border-gray-100 text-sm text-gray-300 rounded-lg cursor-not-allowed">
                  Próxima
                </span>
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
