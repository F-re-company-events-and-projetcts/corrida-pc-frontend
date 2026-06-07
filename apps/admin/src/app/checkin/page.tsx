"use client";

import { useState, useRef } from "react";
import { AdminNav } from "@/components/AdminNav";

interface PreviewData {
  nome: string;
  numeroPeito: number;
  tamanhoCamiseta: string;
  checkinRealizadoEm: string | null;
  categoria: { nome: string; percursoKm: number; tipo: string };
  pedidoStatus: string;
}

type PageState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "preview"; data: PreviewData }
  | { kind: "confirming" }
  | { kind: "success"; nome: string; categoria: { nome: string; percursoKm: number }; numeroPeito: number }
  | { kind: "already_done"; nome: string; checkinRealizadoEm: string }
  | { kind: "error"; message: string };

const STATUS_LABELS: Record<string, string> = {
  AGUARDANDO_PAGAMENTO: "Aguardando pagamento",
  PAGO: "Pago",
  RECUSADO: "Recusado",
  EXPIRADO: "Expirado",
  CANCELADO: "Cancelado",
};

export default function CheckinPage() {
  const [numeroPeito, setNumeroPeito] = useState("");
  const [state, setState] = useState<PageState>({ kind: "idle" });
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleVerificar() {
    const num = parseInt(numeroPeito, 10);
    if (!Number.isInteger(num) || num <= 0) return;
    setState({ kind: "loading" });
    try {
      const res = await fetch(`/api/checkin/${num}`);
      const data = await res.json() as Record<string, unknown>;
      if (res.status === 404) { setState({ kind: "error", message: "Número de peito não encontrado." }); return; }
      if (!res.ok) { setState({ kind: "error", message: (data.error as string) ?? "Erro ao buscar participante." }); return; }
      setState({ kind: "preview", data: data as unknown as PreviewData });
    } catch {
      setState({ kind: "error", message: "Falha de rede. Verifique sua conexão." });
    }
  }

  async function handleConfirmar() {
    const num = parseInt(numeroPeito, 10);
    if (!Number.isInteger(num) || num <= 0) return;
    setState({ kind: "confirming" });
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numeroPeito: num }),
      });
      const data = await res.json() as Record<string, unknown>;
      if (res.status === 409) {
        setState({ kind: "already_done", nome: data.nome as string, checkinRealizadoEm: data.checkinRealizadoEm as string });
        return;
      }
      if (res.status === 422) { setState({ kind: "error", message: `Pagamento não confirmado (${data.status ?? "desconhecido"}).` }); return; }
      if (!res.ok) { setState({ kind: "error", message: (data.error as string) ?? "Erro ao registrar check-in." }); return; }
      setState({ kind: "success", nome: data.nome as string, categoria: data.categoria as { nome: string; percursoKm: number }, numeroPeito: data.numeroPeito as number });
    } catch {
      setState({ kind: "error", message: "Falha de rede. Verifique sua conexão." });
    }
  }

  function handleReset() {
    setNumeroPeito("");
    setState({ kind: "idle" });
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  const canVerify =
    numeroPeito.trim() !== "" &&
    Number.isInteger(parseInt(numeroPeito, 10)) &&
    parseInt(numeroPeito, 10) > 0 &&
    state.kind !== "loading" &&
    state.kind !== "confirming";

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav active="/checkin" />

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        <div className="flex items-baseline gap-3">
          <h2 className="text-2xl font-bold text-gray-900">Check-in presencial</h2>
          <span className="text-sm text-gray-400">Digite o número de peito para verificar e registrar.</span>
        </div>

        {/* Input */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <label htmlFor="numeroPeito" className="block text-sm font-semibold text-gray-700 mb-3">
            Número de peito
          </label>
          <div className="flex gap-3">
            <input
              ref={inputRef}
              id="numeroPeito"
              type="number"
              min={1}
              step={1}
              value={numeroPeito}
              onChange={(e) => { setNumeroPeito(e.target.value); if (state.kind !== "idle") setState({ kind: "idle" }); }}
              onKeyDown={(e) => { if (e.key === "Enter" && canVerify) handleVerificar(); }}
              placeholder="Ex: 42"
              className="w-40 border border-gray-200 rounded-lg px-3 py-2 text-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <button
              onClick={handleVerificar}
              disabled={!canVerify}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {state.kind === "loading" ? "Verificando..." : "Verificar"}
            </button>
          </div>
        </div>

        {/* Confirming */}
        {state.kind === "confirming" && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 text-center text-sm text-gray-500">
            Registrando check-in...
          </div>
        )}

        {/* Preview */}
        {state.kind === "preview" && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <p className="text-sm font-semibold text-gray-700 mb-4">Dados do participante</p>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-6">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Nome</p>
                <p className="font-semibold text-gray-900">{state.data.nome}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Nº de peito</p>
                <p className="font-semibold text-gray-900 font-mono">{state.data.numeroPeito ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Categoria</p>
                <p className="font-semibold text-gray-900">
                  {state.data.categoria.nome}
                  <span className="text-gray-400 font-normal text-sm ml-1">({state.data.categoria.percursoKm} km)</span>
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Camiseta</p>
                <span className="text-xs font-mono font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                  {state.data.tamanhoCamiseta}
                </span>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Pagamento</p>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  state.data.pedidoStatus === "PAGO"
                    ? "bg-emerald-100 text-emerald-700"
                    : state.data.pedidoStatus === "AGUARDANDO_PAGAMENTO"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-red-100 text-red-700"
                }`}>
                  {STATUS_LABELS[state.data.pedidoStatus] ?? state.data.pedidoStatus}
                </span>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Check-in anterior</p>
                {state.data.checkinRealizadoEm ? (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                    {new Date(state.data.checkinRealizadoEm).toLocaleString("pt-BR", {
                      day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
                    })}
                  </span>
                ) : (
                  <span className="text-sm text-gray-400">Não realizado</span>
                )}
              </div>
            </div>

            {state.data.categoria.tipo === "POLICIAL" && (
              <div className="mb-4 flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span><strong>Categoria Policial</strong> — validar comprovante de vínculo funcional presencialmente antes de confirmar.</span>
              </div>
            )}

            <div className="flex gap-3">
              {state.data.pedidoStatus === "PAGO" && !state.data.checkinRealizadoEm ? (
                <button
                  onClick={handleConfirmar}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
                >
                  Confirmar Check-in
                </button>
              ) : state.data.checkinRealizadoEm ? (
                <p className="text-sm text-amber-700 font-medium">Este participante já realizou check-in.</p>
              ) : (
                <p className="text-sm text-red-700 font-medium">Check-in indisponível: pagamento não confirmado.</p>
              )}
              <button
                onClick={handleReset}
                className="px-4 py-2 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Novo
              </button>
            </div>
          </div>
        )}

        {/* Sucesso */}
        {state.kind === "success" && (
          <div className="bg-white rounded-xl border border-gray-200 border-l-4 border-l-emerald-400 shadow-sm p-6">
            <p className="font-semibold text-emerald-700 text-base mb-1">Check-in registrado!</p>
            <p className="text-sm text-gray-600 mb-4">
              <span className="font-semibold text-gray-900">{state.nome}</span> — {state.categoria.nome} ({state.categoria.percursoKm} km) — Peito nº <span className="font-mono font-semibold">#{state.numeroPeito}</span>
            </p>
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
            >
              Próximo corredor
            </button>
          </div>
        )}

        {/* Já fez check-in */}
        {state.kind === "already_done" && (
          <div className="bg-white rounded-xl border border-gray-200 border-l-4 border-l-amber-400 shadow-sm p-6">
            <p className="font-semibold text-amber-700 text-base mb-1">Check-in já realizado</p>
            <p className="text-sm text-gray-600 mb-4">
              <span className="font-semibold text-gray-900">{state.nome}</span> realizou check-in em{" "}
              {new Date(state.checkinRealizadoEm).toLocaleString("pt-BR", {
                day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
              })}.
            </p>
            <button
              onClick={handleReset}
              className="px-4 py-2 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Novo corredor
            </button>
          </div>
        )}

        {/* Erro */}
        {state.kind === "error" && (
          <div className="bg-white rounded-xl border border-gray-200 border-l-4 border-l-red-400 shadow-sm p-6">
            <p className="font-semibold text-red-700 text-base mb-1">Não encontrado</p>
            <p className="text-sm text-gray-600 mb-4">{state.message}</p>
            <button
              onClick={handleReset}
              className="px-4 py-2 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        )}

      </main>
    </div>
  );
}
