"use client";

import { useState, useEffect } from "react";
import { AdminNav } from "@/components/AdminNav";

export default function ConfiguracoesPage() {
  const [precoPolicial, setPrecoPolicial] = useState("");
  const [taxaServico, setTaxaServico] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/configuracoes")
      .then((r) => r.json())
      .then((data: Record<string, string>) => {
        setPrecoPolicial(data.PRECO_POLICIAL ?? "80");
        setTaxaServico(data.TAXA_SERVICO_PCT ?? "10");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const precoBase = parseFloat(precoPolicial) || 0;
  const taxa = parseFloat(taxaServico) || 0;
  const precoFinalPolicial = Math.round(precoBase * (1 + taxa / 100) * 100) / 100;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/configuracoes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          PRECO_POLICIAL: parseFloat(precoPolicial),
          TAXA_SERVICO_PCT: parseFloat(taxaServico),
        }),
      });
      const data = await res.json() as { error?: string };
      if (res.ok) {
        setMsg({ kind: "ok", text: "Configurações salvas. Novos pedidos já usarão os valores atualizados." });
      } else {
        setMsg({ kind: "err", text: data.error ?? "Erro ao salvar." });
      }
    } catch {
      setMsg({ kind: "err", text: "Falha de rede." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav active="/configuracoes" />

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        <div>
          <div className="flex items-baseline gap-3">
            <h2 className="text-2xl font-bold text-gray-900">Configurações</h2>
            <span className="text-sm text-gray-400">Preços e taxa de serviço do evento</span>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center text-sm text-gray-400">
            Carregando…
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">

            {/* Preço policial */}
            <div className="bg-white rounded-xl border border-gray-200 border-l-4 border-l-amber-400 shadow-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <h3 className="text-base font-semibold text-gray-900">Preço base — Policial</h3>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                    Fixo em todos os lotes
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    Valor base (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={precoPolicial}
                    onChange={(e) => setPrecoPolicial(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-2 flex items-end">
                  <p className="text-xs text-gray-400">
                    Cobrado ao participante: <span className="font-semibold text-gray-700">R$ {precoFinalPolicial.toFixed(2)}</span>{" "}
                    (base + taxa de serviço)
                  </p>
                </div>
              </div>
            </div>

            {/* Taxa de serviço */}
            <div className="bg-white rounded-xl border border-gray-200 border-l-4 border-l-blue-400 shadow-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <h3 className="text-base font-semibold text-gray-900">Taxa de serviço</h3>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                    Aplicada sobre todos os preços
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    Percentual (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={taxaServico}
                    onChange={(e) => setTaxaServico(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-2 flex items-end">
                  <p className="text-xs text-gray-400">
                    Adicionada automaticamente sobre o preço base de cada categoria.
                    O preço cidadão é configurado em{" "}
                    <a href="/lotes" className="text-blue-600 hover:underline">Gestão de Lotes</a>.
                  </p>
                </div>
              </div>
            </div>

            {/* Feedback */}
            {msg && (
              <div className={`px-4 py-3 rounded-lg text-sm ${
                msg.kind === "ok"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}>
                {msg.text}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {saving ? "Salvando…" : "Salvar configurações"}
              </button>
            </div>

          </form>
        )}
      </main>
    </div>
  );
}
