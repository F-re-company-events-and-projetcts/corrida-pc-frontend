import { cookies } from "next/headers";
import { redirect } from "next/navigation";

interface CategoriaInfo {
  nome: string;
  percursoKm: number;
}

interface PedidoInfo {
  id: string;
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
  params: { page: string; categoria: string; status: string; q: string }
): Promise<ParticipantesData | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  const qs = new URLSearchParams({
    page: params.page,
    limit: "20",
    ...(params.categoria ? { categoria: params.categoria } : {}),
    ...(params.status ? { status: params.status } : {}),
    ...(params.q ? { q: params.q } : {}),
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
  AGUARDANDO_PAGAMENTO: "bg-yellow-100 text-yellow-800",
  PAGO: "bg-green-100 text-green-800",
  RECUSADO: "bg-red-100 text-red-800",
  EXPIRADO: "bg-gray-100 text-gray-600",
  CANCELADO: "bg-red-100 text-red-800",
};

interface PageProps {
  searchParams: Promise<{ page?: string; categoria?: string; status?: string; q?: string }>;
}

export default async function ParticipantesPage({ searchParams }: PageProps) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;

  if (!token) {
    redirect("/login");
  }

  const params = await searchParams;
  const page = params.page ?? "1";
  const categoria = params.categoria ?? "";
  const status = params.status ?? "";
  const q = params.q ?? "";

  let data: ParticipantesData;
  let categorias: CategoriaFiltro[];

  try {
    const [dataResult, categoriasResult] = await Promise.all([
      fetchParticipantes(token, { page, categoria, status, q }),
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
    for (const [k, v] of Object.entries(overrides)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    const str = next.toString();
    return str ? `?${str}` : "/participantes";
  };

  const prevHref =
    data.page > 1
      ? `/participantes${buildQuery({ page: String(data.page - 1) })}`
      : null;
  const nextHref =
    data.page < data.totalPages
      ? `/participantes${buildQuery({ page: String(data.page + 1) })}`
      : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">
            Corrida do Policial Civil — Admin
          </h1>
          <nav className="flex items-center gap-6 text-sm">
            <a
              href="/dashboard"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Dashboard
            </a>
            <a
              href="/participantes"
              className="font-semibold text-gray-900"
              aria-current="page"
            >
              Participantes
            </a>
            <a
              href="/checkin"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Check-in
            </a>
            <a
              href="/importar"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Importar números
            </a>
            <a
              href="/logout"
              className="text-gray-500 hover:text-red-600 transition-colors"
            >
              Sair
            </a>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Participantes</h2>
          <span className="text-sm text-gray-500">{data.total} encontrado{data.total !== 1 ? "s" : ""}</span>
        </div>

        {/* Filtros */}
        <form method="GET" action="/participantes" className="flex flex-wrap gap-3 mb-6">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Buscar por nome ou e-mail"
            className="border border-gray-300 rounded-lg px-4 py-2 text-sm flex-1 min-w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            name="categoria"
            defaultValue={categoria}
            className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos os status</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Filtrar
          </button>
          {(q || categoria || status) && (
            <a
              href="/participantes"
              className="px-4 py-2 rounded-lg text-sm text-gray-500 hover:text-gray-800 border border-gray-300 hover:border-gray-400 transition-colors"
            >
              Limpar
            </a>
          )}
        </form>

        {/* Tabela */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {data.participantes.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500 text-sm">
              Nenhum participante encontrado.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-6 py-3 font-medium text-gray-500">Nome</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-500">E-mail</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-500">Categoria</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-500">Pedido</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-500">Camiseta</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-500">Nº Peito</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-500">Check-in</th>
                  </tr>
                </thead>
                <tbody>
                  {data.participantes.map((p, idx) => (
                    <tr
                      key={p.id}
                      className={idx < data.participantes.length - 1 ? "border-b border-gray-100" : ""}
                    >
                      <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{p.nome}</td>
                      <td className="px-6 py-4 text-gray-600">{p.email}</td>
                      <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                        {p.categoria.nome}
                        <span className="ml-1 text-gray-400 text-xs">({p.categoria.percursoKm} km)</span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            STATUS_COLORS[p.pedido.status] ?? "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {STATUS_LABELS[p.pedido.status] ?? p.pedido.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{p.tamanhoCamiseta}</td>
                      <td className="px-6 py-4 text-gray-600">
                        {p.numeroPeito ?? "—"}
                      </td>
                      <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                        {p.checkinRealizadoEm
                          ? new Date(p.checkinRealizadoEm).toLocaleString("pt-BR", {
                              day: "2-digit",
                              month: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
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
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-gray-500">
              Página {data.page} de {data.totalPages}
            </p>
            <div className="flex gap-2">
              {prevHref ? (
                <a
                  href={prevHref}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Anterior
                </a>
              ) : (
                <span className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-300 cursor-not-allowed">
                  Anterior
                </span>
              )}
              {nextHref ? (
                <a
                  href={nextHref}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Próxima
                </a>
              ) : (
                <span className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-300 cursor-not-allowed">
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
