import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/AdminNav";

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
  pedidosRecusados: number;
  receitaTotal: number;
  vagasPorCategoria: VagasCategoria[];
  porMetodoPagamento: {
    PIX: { pedidos: number; receita: number };
    CARTAO: { pedidos: number; receita: number };
  };
  checkinProgress: { total: number; feitos: number };
  camisetasPorTamanho: { tamanho: string; count: number }[];
  ultimasInscricoes: { nome: string; categoria: string; metodoPagamento: string; createdAt: string }[];
  inscricoesPorDia: { data: string; count: number }[];
}

async function fetchDashboard(token: string): Promise<DashboardData | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  const res = await fetch(`${apiUrl}/api/v1/admin/dashboard`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error();
  return res.json() as Promise<DashboardData>;
}

function brl(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

function fmtDate(iso: string) {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
  });
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) redirect("/login");

  let data: DashboardData;
  try {
    const result = await fetchDashboard(token);
    if (!result) redirect("/login");
    data = result;
  } catch {
    redirect("/login");
  }

  const checkinPct = data.checkinProgress.total > 0
    ? Math.round((data.checkinProgress.feitos / data.checkinProgress.total) * 100)
    : 0;

  const totalVagas = data.vagasPorCategoria.reduce((s, c) => s + c.vagasTotal, 0);
  const totalOcupadas = data.vagasPorCategoria.reduce((s, c) => s + c.vagasOcupadas, 0);
  const maxDia = Math.max(...data.inscricoesPorDia.map((d) => d.count), 1);
  const totalMetodos = data.porMetodoPagamento.PIX.pedidos + data.porMetodoPagamento.CARTAO.pedidos;
  const maxCamiseta = Math.max(...data.camisetasPorTamanho.map((c) => c.count), 1);

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav active="/dashboard" />

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">

        <div className="flex items-baseline gap-3">
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <span className="text-sm text-gray-400">Visão geral das inscrições</span>
        </div>

        {/* ── 4 Cards principais ── */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            {
              label: "Inscrições confirmadas",
              value: data.totalInscricoes,
              sub: null,
              border: "border-l-emerald-400",
              valueColor: "text-emerald-700",
            },
            {
              label: "Pedidos pagos",
              value: data.pedidosPagos,
              sub: `de ${data.totalPedidos} pedidos`,
              border: "border-l-blue-400",
              valueColor: "text-blue-700",
            },
            {
              label: "Aguardando pagamento",
              value: data.pedidosAguardando,
              sub: null,
              border: "border-l-amber-400",
              valueColor: "text-amber-700",
            },
            {
              label: "Receita total",
              value: brl(data.receitaTotal),
              sub: "pedidos pagos",
              border: "border-l-violet-400",
              valueColor: "text-violet-700",
            },
          ].map((card) => (
            <div
              key={card.label}
              className={`bg-white rounded-xl border border-gray-200 border-l-4 ${card.border} shadow-sm p-5`}
            >
              <p className="text-xs font-medium text-gray-500 mb-3">{card.label}</p>
              <p className={`text-3xl font-black leading-none ${card.valueColor}`}>{card.value}</p>
              {card.sub && <p className="text-xs text-gray-400 mt-2">{card.sub}</p>}
            </div>
          ))}
        </div>

        {/* ── Check-in + Encerrados ── */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 lg:col-span-2">
            <p className="text-sm font-semibold text-gray-700 mb-4">Progresso de check-in</p>
            <div className="flex items-center gap-6 mb-4">
              <div>
                <span className="text-4xl font-black text-gray-900">{data.checkinProgress.feitos}</span>
                <span className="text-lg text-gray-400 ml-2">/ {data.checkinProgress.total}</span>
              </div>
              <span className={`text-sm font-bold px-3 py-1 rounded-full ${checkinPct === 100 ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>
                {checkinPct}%
              </span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all ${checkinPct === 100 ? "bg-emerald-500" : "bg-blue-500"}`}
                style={{ width: `${checkinPct}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">inscritos que realizaram check-in</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <p className="text-sm font-semibold text-gray-700 mb-4">Pedidos encerrados</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Expirados (PIX)</span>
                <span className={`text-2xl font-black ${data.pedidosExpirados > 0 ? "text-orange-600" : "text-gray-300"}`}>
                  {data.pedidosExpirados}
                </span>
              </div>
              <div className="h-px bg-gray-100" />
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Recusados (cartão)</span>
                <span className={`text-2xl font-black ${data.pedidosRecusados > 0 ? "text-red-600" : "text-gray-300"}`}>
                  {data.pedidosRecusados}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Vagas por categoria ── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-700">Vagas por categoria</p>
            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
              {totalOcupadas} / {totalVagas} ocupadas
            </span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500">Categoria</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500">Tipo</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500">Km</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500">Ocupação</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 w-48">Progresso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.vagasPorCategoria.map((cat) => {
                const pct = cat.vagasTotal > 0 ? Math.round((cat.vagasOcupadas / cat.vagasTotal) * 100) : 0;
                const barColor = pct >= 100 ? "bg-red-500" : pct >= 80 ? "bg-amber-500" : "bg-emerald-500";
                return (
                  <tr key={cat.id}>
                    <td className="px-6 py-4 font-semibold text-gray-900">{cat.nome}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cat.tipo === "CIDADAO" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>
                        {cat.tipo === "CIDADAO" ? "Cidadão" : "Policial"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{cat.percursoKm} km</td>
                    <td className="px-6 py-4 font-mono text-sm text-gray-700">
                      {cat.vagasOcupadas}/{cat.vagasTotal}
                      {pct >= 100 && <span className="ml-2 text-xs font-bold text-red-600">ESGOTADO</span>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-1.5 rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-gray-400 w-7 text-right">{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── Pagamentos + Camisetas ── */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <p className="text-sm font-semibold text-gray-700 mb-5">Pagamentos confirmados</p>
            <div className="space-y-5">
              {(["PIX", "CARTAO"] as const).map((metodo) => {
                const m = data.porMetodoPagamento[metodo];
                const pct = totalMetodos > 0 ? Math.round((m.pedidos / totalMetodos) * 100) : 0;
                const isPix = metodo === "PIX";
                return (
                  <div key={metodo}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">{isPix ? "PIX" : "Cartão de crédito"}</span>
                      <div className="text-right text-sm">
                        <span className="text-gray-400">{m.pedidos} {m.pedidos === 1 ? "pedido" : "pedidos"}</span>
                        <span className="mx-1.5 text-gray-200">·</span>
                        <span className="font-semibold text-gray-800">{brl(m.receita)}</span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full ${isPix ? "bg-emerald-500" : "bg-violet-500"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{pct}% dos pagamentos confirmados</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm font-semibold text-gray-700">Camisetas por tamanho</p>
              <span className="text-xs text-gray-400">
                {data.camisetasPorTamanho.reduce((s, c) => s + c.count, 0)} total
              </span>
            </div>
            {data.camisetasPorTamanho.length === 0 ? (
              <p className="text-sm text-gray-400">Sem dados ainda.</p>
            ) : (
              <div className="space-y-3">
                {data.camisetasPorTamanho.map(({ tamanho, count }) => {
                  const pct = Math.round((count / maxCamiseta) * 100);
                  return (
                    <div key={tamanho} className="flex items-center gap-3">
                      <span className="text-xs font-bold font-mono text-gray-600 w-8 shrink-0">{tamanho}</span>
                      <div className="flex-1 h-5 bg-gray-100 rounded-lg overflow-hidden">
                        <div
                          className="h-5 bg-indigo-400 rounded-lg"
                          style={{ width: `${Math.max(pct, 5)}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-gray-700 w-4 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Inscrições por dia + Últimas ── */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <p className="text-sm font-semibold text-gray-700 mb-5">
              Inscrições por dia <span className="text-gray-400 font-normal text-xs ml-1">últimos 14 dias</span>
            </p>
            {data.inscricoesPorDia.length === 0 ? (
              <p className="text-sm text-gray-400">Sem inscrições neste período.</p>
            ) : (
              <div className="space-y-2">
                {data.inscricoesPorDia.map(({ data: dia, count }) => {
                  const pct = Math.round((count / maxDia) * 100);
                  return (
                    <div key={dia} className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 font-mono w-10 shrink-0">{fmtDate(dia)}</span>
                      <div className="flex-1 h-5 bg-gray-100 rounded-lg overflow-hidden">
                        <div
                          className="h-5 bg-blue-400 rounded-lg"
                          style={{ width: `${Math.max(pct, 5)}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-gray-700 w-4 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <p className="text-sm font-semibold text-gray-700 mb-5">Últimas inscrições</p>
            {data.ultimasInscricoes.length === 0 ? (
              <p className="text-sm text-gray-400">Sem inscrições ainda.</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {data.ultimasInscricoes.map((ins, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">{ins.nome}</p>
                      <p className="text-xs text-gray-400">{ins.categoria}</p>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ins.metodoPagamento === "PIX" ? "bg-emerald-100 text-emerald-700" : "bg-violet-100 text-violet-700"}`}>
                        {ins.metodoPagamento === "PIX" ? "PIX" : "Cartão"}
                      </span>
                      <p className="text-xs text-gray-400 mt-0.5">{fmtTime(ins.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <a href="/participantes" className="block mt-4 text-xs text-blue-600 hover:underline">
              Ver todos →
            </a>
          </div>
        </div>

      </main>
    </div>
  );
}
