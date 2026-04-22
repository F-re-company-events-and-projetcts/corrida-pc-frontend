import { cookies } from "next/headers";
import { redirect } from "next/navigation";

interface VagasCategoria {
  id: string;
  nome: string;
  percursoKm: number;
  tipo: "CIDADAO" | "POLICIAL";
  vagasOcupadas: number;
  vagasTotal: number;
}

interface DashboardData {
  totalInscricoes: number;
  totalPedidos: number;
  pedidosPagos: number;
  pedidosAguardando: number;
  pedidosExpirados: number;
  receitaTotal: number;
  vagasPorCategoria: VagasCategoria[];
}

async function fetchDashboard(token: string): Promise<DashboardData | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  const res = await fetch(`${apiUrl}/api/v1/admin/dashboard`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error(`Dashboard fetch failed: ${res.status}`);
  return res.json() as Promise<DashboardData>;
}

function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

interface StatCardProps {
  label: string;
  value: string | number;
  accent?: string;
}

function StatCard({ label, value, accent = "bg-white" }: StatCardProps) {
  return (
    <div className={`${accent} rounded-xl border border-gray-200 p-6 shadow-sm`}>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;

  if (!token) {
    redirect("/login");
  }

  let data: DashboardData;
  try {
    const result = await fetchDashboard(token);
    if (!result) redirect("/login");
    data = result;
  } catch {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">
            Corrida do Policial Civil — Admin
          </h1>
          <nav className="flex items-center gap-6 text-sm">
            <a
              href="/participantes"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Participantes
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

      <main className="max-w-6xl mx-auto px-8 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>

        {/* Totalizadores */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
          <StatCard label="Total de inscrições" value={data.totalInscricoes} />
          <StatCard label="Pedidos pagos" value={data.pedidosPagos} accent="bg-green-50" />
          <StatCard
            label="Aguardando pagamento"
            value={data.pedidosAguardando}
            accent="bg-yellow-50"
          />
          <StatCard label="Receita total" value={formatBRL(data.receitaTotal)} accent="bg-blue-50" />
        </div>

        {/* Vagas por categoria */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Vagas por categoria
          </h3>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Categoria</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Tipo</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Percurso</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Ocupação</th>
                  <th className="px-6 py-3 font-medium text-gray-500 w-48">Progresso</th>
                </tr>
              </thead>
              <tbody>
                {data.vagasPorCategoria.map((cat, idx) => {
                  const pct =
                    cat.vagasTotal > 0
                      ? Math.round((cat.vagasOcupadas / cat.vagasTotal) * 100)
                      : 0;
                  const barColor =
                    pct >= 100
                      ? "bg-red-500"
                      : pct >= 80
                      ? "bg-yellow-500"
                      : "bg-green-500";

                  return (
                    <tr
                      key={cat.id}
                      className={
                        idx < data.vagasPorCategoria.length - 1
                          ? "border-b border-gray-100"
                          : ""
                      }
                    >
                      <td className="px-6 py-4 font-medium text-gray-900">{cat.nome}</td>
                      <td className="px-6 py-4 text-gray-600">
                        {cat.tipo === "POLICIAL" ? "Policial" : "Cidadão"}
                      </td>
                      <td className="px-6 py-4 text-gray-600">{cat.percursoKm} km</td>
                      <td className="px-6 py-4 text-gray-700">
                        {cat.vagasOcupadas}/{cat.vagasTotal}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-2 rounded-full ${barColor}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 w-8 text-right">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
