"use client";

import { useState } from "react";

const STATUS_OPTIONS = [
  { value: "AGUARDANDO_PAGAMENTO", label: "Aguardando pagamento" },
  { value: "PAGO", label: "Pago" },
  { value: "RECUSADO", label: "Recusado" },
  { value: "EXPIRADO", label: "Expirado" },
  { value: "CANCELADO", label: "Cancelado" },
];

interface Props {
  pedidoId: string;
  statusAtual: string;
  temParticipantes: boolean;
}

export function ReprocessarButton({ pedidoId }: { pedidoId: string }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  async function handleReprocessar() {
    if (!confirm("Isso irá criar os participantes e marcar o pedido como PAGO. Confirma?")) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`/api/pedidos/${pedidoId}/reprocessar`, { method: "POST" });
      const data = await res.json() as { ok?: boolean; participantesCriados?: number; error?: string };
      if (res.ok) {
        setResult({ kind: "ok", text: `✓ ${data.participantesCriados} participante(s) criado(s). Recarregue a página.` });
      } else {
        setResult({ kind: "err", text: data.error ?? "Erro ao reprocessar." });
      }
    } catch {
      setResult({ kind: "err", text: "Falha de rede." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 border-l-4 border-l-amber-400 shadow-sm p-6">
      <p className="text-sm font-semibold text-gray-700 mb-2">Reprocessar pagamento</p>
      <p className="text-xs text-gray-500 mb-4">
        Use quando o pagamento foi aprovado no Mercado Pago mas os participantes não foram criados por erro no webhook.
        Lê o rascunho do pedido e cria os participantes automaticamente.
      </p>
      {result && (
        <div className={`mb-3 px-3 py-2 rounded-lg text-sm ${result.kind === "ok" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
          {result.text}
        </div>
      )}
      <button
        onClick={handleReprocessar}
        disabled={loading}
        className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-50 transition-colors"
      >
        {loading ? "Processando…" : "Reprocessar e criar participantes"}
      </button>
    </div>
  );
}

export function AlterarStatusForm({ pedidoId, statusAtual, temParticipantes: _ }: Props) {
  const [novoStatus, setNovoStatus] = useState(statusAtual);
  const [motivo, setMotivo] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const changed = novoStatus !== statusAtual;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!changed || !motivo.trim()) return;
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/pedidos/${pedidoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: novoStatus, motivo: motivo.trim() }),
      });
      const data = await res.json() as { error?: string };
      if (res.ok) {
        setMsg({ kind: "ok", text: "Status alterado com sucesso. Recarregue a página para ver." });
        setMotivo("");
      } else {
        setMsg({ kind: "err", text: data.error ?? "Erro ao alterar status." });
      }
    } catch {
      setMsg({ kind: "err", text: "Falha de rede." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <p className="text-sm font-semibold text-gray-700 mb-4">Alterar status do pedido</p>

      {msg && (
        <div className={`mb-4 px-3 py-2 rounded-lg text-sm ${msg.kind === "ok" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
          {msg.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Novo status</label>
          <select
            value={novoStatus}
            onChange={(e) => setNovoStatus(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {changed && (
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Motivo <span className="text-red-500">*</span>
            </label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Descreva o motivo da alteração..."
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        )}

        {novoStatus === "CANCELADO" && statusAtual === "PAGO" && (
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
            <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Cancelar um pedido <strong>Pago</strong> irá devolver as vagas ocupadas às categorias correspondentes.</span>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!changed || !motivo.trim() || saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? "Salvando…" : "Confirmar alteração"}
          </button>
        </div>
      </form>
    </div>
  );
}
