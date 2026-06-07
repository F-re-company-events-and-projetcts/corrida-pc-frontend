"use client";

import { useState, useEffect } from "react";
import { AdminNav } from "@/components/AdminNav";

interface Lote {
  id: string;
  nome: string;
  precoCidadao: number;
  ativo: boolean;
  dataInicio: string;
  dataFim: string;
}

function toDateInputValue(iso: string) {
  return iso.slice(0, 10);
}

export default function LotesPage() {
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<Lote>>({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ id: string; kind: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/lotes")
      .then((r) => r.json())
      .then((data: Lote[]) => { setLotes(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function startEdit(lote: Lote) {
    setEditingId(lote.id);
    setEditValues({ precoCidadao: lote.precoCidadao, dataInicio: lote.dataInicio, dataFim: lote.dataFim });
    setMsg(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditValues({});
  }

  async function saveEdit(id: string) {
    setSaving(true);
    setMsg(null);
    try {
      const body: Record<string, unknown> = {};
      if (editValues.precoCidadao !== undefined) body.precoCidadao = Number(editValues.precoCidadao);
      if (editValues.dataInicio) body.dataInicio = new Date(editValues.dataInicio).toISOString();
      if (editValues.dataFim) body.dataFim = new Date(editValues.dataFim).toISOString();

      const res = await fetch(`/api/lotes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json() as Lote & { error?: string };
      if (res.ok) {
        setLotes((prev) => prev.map((l) => (l.id === id ? data : l)));
        setEditingId(null);
        setMsg({ id, kind: "ok", text: "Lote atualizado com sucesso." });
      } else {
        setMsg({ id, kind: "err", text: data.error ?? "Erro ao salvar." });
      }
    } catch {
      setMsg({ id, kind: "err", text: "Falha de rede." });
    } finally {
      setSaving(false);
    }
  }

  async function toggleAtivo(lote: Lote) {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/lotes/${lote.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ativo: !lote.ativo }),
      });
      const data = await res.json() as Lote & { error?: string };
      if (res.ok) {
        setLotes((prev) => prev.map((l) => l.id === lote.id ? data : { ...l, ativo: false }));
        setMsg({ id: lote.id, kind: "ok", text: lote.ativo ? "Lote desativado." : "Lote ativado." });
      } else {
        setMsg({ id: lote.id, kind: "err", text: data.error ?? "Erro." });
      }
    } catch {
      setMsg({ id: lote.id, kind: "err", text: "Falha de rede." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav active="/lotes" />

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        <div>
          <div className="flex items-baseline gap-3">
            <h2 className="text-2xl font-bold text-gray-900">Gestão de Lotes</h2>
            <span className="text-sm text-gray-400">Apenas um lote pode estar ativo por vez.</span>
          </div>
          <p className="text-xs font-medium text-gray-500 mt-1">Preço policial é sempre R$ 80,00 fixo, independente do lote.</p>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center text-sm text-gray-400">
            Carregando lotes…
          </div>
        ) : (
          <div className="space-y-4">
            {lotes.map((lote) => {
              const isEditing = editingId === lote.id;
              const loteMsg = msg?.id === lote.id ? msg : null;

              return (
                <div
                  key={lote.id}
                  className={`bg-white rounded-xl border border-gray-200 border-l-4 shadow-sm p-6 ${
                    lote.ativo ? "border-l-emerald-400" : "border-l-gray-200"
                  }`}
                >
                  {/* Cabeçalho do lote */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <h3 className="text-base font-semibold text-gray-900">{lote.nome}</h3>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        lote.ativo ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                      }`}>
                        {lote.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleAtivo(lote)}
                        disabled={saving}
                        className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors disabled:opacity-50 ${
                          lote.ativo
                            ? "border-gray-200 text-gray-600 hover:bg-gray-50"
                            : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                        }`}
                      >
                        {lote.ativo ? "Desativar" : "Ativar"}
                      </button>
                      {!isEditing && (
                        <button
                          onClick={() => startEdit(lote)}
                          className="px-4 py-2 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Editar
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Feedback */}
                  {loteMsg && (
                    <div className={`mb-4 px-3 py-2 rounded-lg text-sm ${
                      loteMsg.kind === "ok"
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : "bg-red-50 text-red-800 border border-red-200"
                    }`}>
                      {loteMsg.text}
                    </div>
                  )}

                  {/* Formulário de edição */}
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                            Preço cidadão (R$)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={editValues.precoCidadao ?? ""}
                            onChange={(e) => setEditValues({ ...editValues, precoCidadao: parseFloat(e.target.value) })}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Início</label>
                          <input
                            type="date"
                            value={editValues.dataInicio ? toDateInputValue(editValues.dataInicio) : ""}
                            onChange={(e) => setEditValues({ ...editValues, dataInicio: e.target.value })}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Fim</label>
                          <input
                            type="date"
                            value={editValues.dataFim ? toDateInputValue(editValues.dataFim) : ""}
                            onChange={(e) => setEditValues({ ...editValues, dataFim: e.target.value })}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={cancelEdit}
                          className="px-4 py-2 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => saveEdit(lote.id)}
                          disabled={saving}
                          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                          {saving ? "Salvando…" : "Salvar"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Dados do lote */
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Preço cidadão</p>
                        <p className="font-semibold text-gray-900">R$ {lote.precoCidadao.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Início</p>
                        <p className="text-sm text-gray-700">{new Date(lote.dataInicio).toLocaleDateString("pt-BR")}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Fim</p>
                        <p className="text-sm text-gray-700">{new Date(lote.dataFim).toLocaleDateString("pt-BR")}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </main>
    </div>
  );
}
