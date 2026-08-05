"use client";

import { useState, useEffect } from "react";
import { AdminNav } from "@/components/AdminNav";

interface LoteAtivo { id: string; nome: string; precoCidadao: number; dataFim: string; ativo: boolean; }

export default function ConfiguracoesPage() {
  const [precoPolicial, setPrecoPolicial] = useState("");
  const [taxaServico, setTaxaServico] = useState("");
  const [loteAtivo, setLoteAtivo] = useState<LoteAtivo | null>(null);
  const [precoCidadao, setPrecoCidadao] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingLote, setSavingLote] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [msgLote, setMsgLote] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/configuracoes").then((r) => r.json()),
      fetch("/api/lotes").then((r) => r.json()),
    ]).then(([configs, lotes]: [Record<string, string>, LoteAtivo[]]) => {
      setPrecoPolicial(configs.PRECO_POLICIAL ?? "80");
      setTaxaServico(configs.TAXA_SERVICO_PCT ?? "10");
      const ativo = (lotes as LoteAtivo[]).find((l) => l.ativo) ?? null;
      setLoteAtivo(ativo);
      if (ativo) setPrecoCidadao(String(ativo.precoCidadao));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const precoBase = parseFloat(precoPolicial) || 0;
  const taxa = parseFloat(taxaServico) || 0;
  const precoFinalPolicial = Math.round(precoBase * (1 + taxa / 100) * 100) / 100;
  const precoFinalCidadao = Math.round((parseFloat(precoCidadao) || 0) * (1 + taxa / 100) * 100) / 100;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/configuracoes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ PRECO_POLICIAL: parseFloat(precoPolicial), TAXA_SERVICO_PCT: parseFloat(taxaServico) }),
      });
      const data = await res.json() as { error?: string };
      setMsg(res.ok
        ? { kind: "ok", text: "Configurações salvas. Novos pedidos já usarão os valores atualizados." }
        : { kind: "err", text: data.error ?? "Erro ao salvar." });
    } catch { setMsg({ kind: "err", text: "Falha de rede." }); }
    finally { setSaving(false); }
  }

  async function handleSaveLote(e: React.FormEvent) {
    e.preventDefault();
    if (!loteAtivo) return;
    setSavingLote(true);
    setMsgLote(null);
    try {
      const res = await fetch(`/api/lotes/${loteAtivo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ precoCidadao: parseFloat(precoCidadao) }),
      });
      const data = await res.json() as LoteAtivo & { error?: string };
      if (res.ok) { setLoteAtivo(data); setMsgLote({ kind: "ok", text: "Preço do cidadão atualizado." }); }
      else { setMsgLote({ kind: "err", text: data.error ?? "Erro ao salvar." }); }
    } catch { setMsgLote({ kind: "err", text: "Falha de rede." }); }
    finally { setSavingLote(false); }
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
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center text-sm text-gray-400">Carregando…</div>
        ) : (
          <div className="space-y-4">

            {/* Preço cidadão — lote ativo */}
            <div className="bg-white rounded-xl border border-gray-200 border-l-4 border-l-emerald-400 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-5">
                <h3 className="text-base font-semibold text-gray-900">Preço base — Cidadão</h3>
                {loteAtivo ? (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">{loteAtivo.nome} ativo</span>
                ) : (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Nenhum lote ativo</span>
                )}
              </div>
              {loteAtivo ? (
                <form onSubmit={handleSaveLote} className="space-y-4">
                  {msgLote && (
                    <div className={`px-3 py-2 rounded-lg text-sm ${msgLote.kind === "ok" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"}`}>{msgLote.text}</div>
                  )}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Valor base (R$)</label>
                      <input type="number" step="0.01" min="0" value={precoCidadao} onChange={(e) => setPrecoCidadao(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div className="col-span-2 flex items-end">
                      <p className="text-xs text-gray-400">
                        Cobrado ao participante: <span className="font-semibold text-gray-700">R$ {precoFinalCidadao.toFixed(2)}</span> (base + taxa)
                        {loteAtivo.dataFim && <> · Lote válido até {new Date(loteAtivo.dataFim).toLocaleDateString("pt-BR")}</>}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button type="submit" disabled={savingLote}
                      className="px-5 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                      {savingLote ? "Salvando…" : "Salvar preço cidadão"}
                    </button>
                  </div>
                </form>
              ) : (
                <p className="text-sm text-gray-400">Ative um lote em <a href="/lotes" className="text-blue-600 hover:underline">Gestão de Lotes</a> para editar o preço do cidadão.</p>
              )}
            </div>

            {/* Preço policial + Taxa */}
            <form onSubmit={handleSave} className="space-y-4">
              <div className="bg-white rounded-xl border border-gray-200 border-l-4 border-l-amber-400 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-5">
                  <h3 className="text-base font-semibold text-gray-900">Preço base — Policial</h3>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Fixo em todos os lotes</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Valor base (R$)</label>
                    <input type="number" step="0.01" min="0" value={precoPolicial} onChange={(e) => setPrecoPolicial(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="col-span-2 flex items-end">
                    <p className="text-xs text-gray-400">Cobrado ao participante: <span className="font-semibold text-gray-700">R$ {precoFinalPolicial.toFixed(2)}</span> (base + taxa)</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 border-l-4 border-l-blue-400 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-5">
                  <h3 className="text-base font-semibold text-gray-900">Taxa de serviço</h3>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Aplicada sobre todos os preços</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Percentual (%)</label>
                    <input type="number" step="0.1" min="0" max="100" value={taxaServico} onChange={(e) => setTaxaServico(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="col-span-2 flex items-end">
                    <p className="text-xs text-gray-400">Adicionada automaticamente sobre o preço base de cada categoria.</p>
                  </div>
                </div>
              </div>

              {msg && (
                <div className={`px-4 py-3 rounded-lg text-sm ${msg.kind === "ok" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"}`}>{msg.text}</div>
              )}
              <div className="flex justify-end">
                <button type="submit" disabled={saving}
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
                  {saving ? "Salvando…" : "Salvar configurações"}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
