import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { AdminNav } from "@/components/AdminNav";
import { AlterarStatusForm } from "./AlterarStatusForm";

const STATUS_LABELS: Record<string, string> = {
  AGUARDANDO_PAGAMENTO: "Aguardando pagamento",
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

interface Participante {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  tamanhoCamiseta: string;
  numeroPeito: number | null;
  checkinRealizadoEm: string | null;
  dataNascimento: string;
  categoria: { id: string; nome: string; percursoKm: number };
}

interface PedidoDetail {
  id: string;
  numeroPedido: string;
  status: string;
  metodoPagamento: string;
  total: number;
  paymentId: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  participantes: Participante[];
  pagamento: {
    paymentIdGateway: string;
    valor: number;
    metodo: string;
    status: string;
    webhookRecebidoEm: string | null;
  } | null;
}

async function fetchPedido(token: string, id: string): Promise<PedidoDetail | null | "not_found"> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  const res = await fetch(`${apiUrl}/api/v1/admin/pedidos/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (res.status === 401) return null;
  if (res.status === 404) return "not_found";
  if (!res.ok) throw new Error("Falha ao buscar pedido");
  return res.json() as Promise<PedidoDetail>;
}

function calcularIdade(dataNascimento: string): number {
  const nasc = new Date(dataNascimento);
  const hoje = new Date();
  let age = hoje.getFullYear() - nasc.getFullYear();
  if (hoje < new Date(hoje.getFullYear(), nasc.getMonth(), nasc.getDate())) age--;
  return age;
}

export default async function PedidoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) redirect("/login");

  const pedido = await fetchPedido(token, id);
  if (pedido === null) redirect("/login");
  if (pedido === "not_found") notFound();

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav active="/pedidos" />

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        <div className="flex items-center gap-3">
          <a href="/pedidos" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">← Pedidos</a>
          <span className="text-gray-300">/</span>
          <span className="font-mono font-semibold text-gray-800">{pedido.numeroPedido}</span>
        </div>

        {/* Resumo do pedido */}
        <div className={`bg-white rounded-xl border border-gray-200 border-l-4 shadow-sm p-6 ${STATUS_COLORS[pedido.status]?.includes("emerald") ? "border-l-emerald-400" : STATUS_COLORS[pedido.status]?.includes("amber") ? "border-l-amber-400" : "border-l-gray-300"}`}>
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <p className="font-mono text-2xl font-black text-gray-900">{pedido.numeroPedido}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Criado em {new Date(pedido.createdAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[pedido.status] ?? "bg-gray-100 text-gray-500"}`}>
              {STATUS_LABELS[pedido.status] ?? pedido.status}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Pagamento</p>
              <p className="text-sm font-semibold text-gray-800">{pedido.metodoPagamento === "PIX" ? "PIX" : "Cartão"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Total</p>
              <p className="text-sm font-semibold text-gray-800">R$ {pedido.total.toFixed(2).replace(".", ",")}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Inscritos</p>
              <p className="text-sm font-semibold text-gray-800">{pedido.participantes.length}</p>
            </div>
            {pedido.pagamento && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Gateway ID</p>
                <p className="text-xs font-mono text-gray-600 truncate">{pedido.pagamento.paymentIdGateway}</p>
              </div>
            )}
          </div>
        </div>

        {/* Participantes */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-700">Participantes</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Nome</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Categoria</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Idade</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Camiseta</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Nº Peito</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Check-in</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {pedido.participantes.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-3.5">
                    <a href={`/participantes/${p.id}`} className="font-semibold text-gray-900 hover:text-blue-600 hover:underline transition-colors">
                      {p.nome}
                    </a>
                    <p className="text-xs text-gray-400">{p.email}</p>
                  </td>
                  <td className="px-6 py-3.5 text-sm text-gray-700">{p.categoria.nome}</td>
                  <td className="px-6 py-3.5 text-sm text-gray-600">{calcularIdade(p.dataNascimento)} anos</td>
                  <td className="px-6 py-3.5">
                    <span className="text-xs font-mono font-semibold bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                      {p.tamanhoCamiseta}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 font-mono text-sm">
                    {p.numeroPeito != null ? <span className="font-semibold text-gray-800">#{p.numeroPeito}</span> : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-6 py-3.5 text-sm">
                    {p.checkinRealizadoEm ? (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                        {new Date(p.checkinRealizadoEm).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Alterar status */}
        <AlterarStatusForm pedidoId={pedido.id} statusAtual={pedido.status} />

      </main>
    </div>
  );
}
