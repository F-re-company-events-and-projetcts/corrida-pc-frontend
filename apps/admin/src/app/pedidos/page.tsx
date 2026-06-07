import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/AdminNav";

interface Pedido {
  id: string;
  numeroPedido: string;
  status: string;
  metodoPagamento: string;
  total: number;
  createdAt: string;
  participantesCount: number;
}

interface PedidosData {
  pedidos: Pedido[];
  total: number;
  page: number;
  totalPages: number;
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

async function fetchPedidos(token: string, qs: URLSearchParams): Promise<PedidosData | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  const res = await fetch(`${apiUrl}/api/v1/admin/pedidos?${qs}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error("Falha ao buscar pedidos");
  return res.json() as Promise<PedidosData>;
}

interface PageProps {
  searchParams: Promise<{ page?: string; status?: string; metodo?: string; q?: string }>;
}

export default async function PedidosPage({ searchParams }: PageProps) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) redirect("/login");

  const params = await searchParams;
  const page = params.page ?? "1";
  const status = params.status ?? "";
  const metodo = params.metodo ?? "";
  const q = params.q ?? "";

  const qs = new URLSearchParams({ page, limit: "20" });
  if (status) qs.set("status", status);
  if (metodo) qs.set("metodo", metodo);
  if (q) qs.set("q", q);

  let data: PedidosData;
  try {
    const result = await fetchPedidos(token, qs);
    if (!result) redirect("/login");
    data = result;
  } catch {
    redirect("/login");
  }

  const buildQuery = (overrides: Record<string, string>) => {
    const next = new URLSearchParams();
    if (page !== "1") next.set("page", page);
    if (status) next.set("status", status);
    if (metodo) next.set("metodo", metodo);
    if (q) next.set("q", q);
    for (const [k, v] of Object.entries(overrides)) {
      if (v) next.set(k, v); else next.delete(k);
    }
    const str = next.toString();
    return str ? `?${str}` : "/pedidos";
  };

  const prevHref = data.page > 1 ? `/pedidos${buildQuery({ page: String(data.page - 1) })}` : null;
  const nextHref = data.page < data.totalPages ? `/pedidos${buildQuery({ page: String(data.page + 1) })}` : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav active="/pedidos" />

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">

        <div className="flex items-baseline gap-3">
          <h2 className="text-2xl font-bold text-gray-900">Pedidos</h2>
          <span className="text-sm text-gray-400">{data.total} pedido{data.total !== 1 ? "s" : ""}</span>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <form method="GET" action="/pedidos" className="flex flex-wrap gap-3">
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Buscar por número do pedido"
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 flex-1 min-w-48 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              name="status"
              defaultValue={status}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos os status</option>
              {Object.entries(STATUS_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
            <select
              name="metodo"
              defaultValue={metodo}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos os métodos</option>
              <option value="PIX">PIX</option>
              <option value="CARTAO">Cartão</option>
            </select>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              Filtrar
            </button>
            {(q || status || metodo) && (
              <a href="/pedidos" className="px-4 py-2 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
                Limpar
              </a>
            )}
          </form>
        </div>

        {/* Tabela */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {data.pedidos.length === 0 ? (
            <div className="px-6 py-16 text-center text-sm text-gray-400">Nenhum pedido encontrado.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Pedido</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Pagamento</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Inscritos</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Total</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Data</th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.pedidos.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-3.5">
                        <a href={`/pedidos/${p.id}`} className="font-mono font-semibold text-gray-800 hover:text-blue-600 hover:underline transition-colors">
                          {p.numeroPedido}
                        </a>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[p.status] ?? "bg-gray-100 text-gray-500"}`}>
                          {STATUS_LABELS[p.status] ?? p.status}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-sm text-gray-600">
                        {p.metodoPagamento === "PIX" ? "PIX" : "Cartão"}
                      </td>
                      <td className="px-6 py-3.5 text-sm text-gray-600">
                        {p.participantesCount} inscrito{p.participantesCount !== 1 ? "s" : ""}
                      </td>
                      <td className="px-6 py-3.5 font-semibold text-gray-800">
                        R$ {p.total.toFixed(2).replace(".", ",")}
                      </td>
                      <td className="px-6 py-3.5 text-sm text-gray-500">
                        {new Date(p.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <a href={`/pedidos/${p.id}`} className="text-xs text-blue-600 hover:underline font-medium">
                          Ver →
                        </a>
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
              {prevHref
                ? <a href={prevHref} className="px-4 py-2 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">Anterior</a>
                : <span className="px-4 py-2 border border-gray-100 text-sm text-gray-300 rounded-lg cursor-not-allowed">Anterior</span>
              }
              {nextHref
                ? <a href={nextHref} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">Próxima</a>
                : <span className="px-4 py-2 border border-gray-100 text-sm text-gray-300 rounded-lg cursor-not-allowed">Próxima</span>
              }
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
