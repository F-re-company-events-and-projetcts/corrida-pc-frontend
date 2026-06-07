"use client";

import { useState, useRef } from "react";
import { AdminNav } from "@/components/AdminNav";

interface PreviewData {
  nome: string;
  numeroPeito: number | null;
  tamanhoCamiseta: string;
  checkinRealizadoEm: string | null;
  categoria: { nome: string; percursoKm: number; tipo: string };
  pedidoStatus: string;
  participanteId: string;
}

type PageState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "preview"; data: PreviewData }
  | { kind: "confirming" }
  | { kind: "success"; nome: string; categoria: { nome: string; percursoKm: number }; numeroPeito: number | null }
  | { kind: "already_done"; nome: string; checkinRealizadoEm: string }
  | { kind: "error"; message: string };

const STATUS_LABELS: Record<string, string> = {
  AGUARDANDO_PAGAMENTO: "Aguardando pagamento",
  PAGO: "Pago",
  RECUSADO: "Recusado",
  EXPIRADO: "Expirado",
  CANCELADO: "Cancelado",
};

function mascaraCpf(v: string) {
  const d = v.replace(/\D/g, "");
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9, 11)}`;
}

export default function CheckinPage() {
  const [cpf, setCpf] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [state, setState] = useState<PageState>({ kind: "idle" });
  const cpfRef = useRef<HTMLInputElement>(null);

  async function handleVerificar() {
    if (cpf.replace(/\D/g, "").length < 11 || !dataNascimento) return;
    setState({ kind: "loading" });
    try {
      const res = await fetch("/api/checkin/cpf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cpf: cpf.replace(/\D/g, ""), dataNascimento }),
      });
      const data = await res.json() as Record<string, unknown>;
      if (res.status === 404) { setState({ kind: "error", message: "Participante não encontrado. Verifique o CPF e a data de nascimento." }); return; }
      if (!res.ok) { setState({ kind: "error", message: (data.error as string) ?? "Erro ao buscar participante." }); return; }
      setState({ kind: "preview", data: data as unknown as PreviewData });
    } catch {
      setState({ kind: "error", message: "Falha de rede." });
    }
  }

  async function handleConfirmar() {
    if (state.kind !== "preview") return;
    setState({ kind: "confirming" });
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numeroPeito: state.data.numeroPeito, participanteId: state.data.participanteId }),
      });
      const data = await res.json() as Record<string, unknown>;
      if (res.status === 409) {
        setState({ kind: "already_done", nome: data.nome as string, checkinRealizadoEm: data.checkinRealizadoEm as string });
        return;
      }
      if (res.status === 422) { setState({ kind: "error", message: `Pagamento não confirmado.` }); return; }
      if (!res.ok) { setState({ kind: "error", message: (data.error as string) ?? "Erro ao registrar check-in." }); return; }
      setState({ kind: "success", nome: data.nome as string, categoria: data.categoria as { nome: string; percursoKm: number }, numeroPeito: data.numeroPeito as number | null });
    } catch {
      setState({ kind: "error", message: "Falha de rede." });
    }
  }

  function handleReset() {
    setCpf("");
    setDataNascimento("");
    setState({ kind: "idle" });
    setTimeout(() => cpfRef.current?.focus(), 50);
  }

  const canVerify = cpf.replace(/\D/g, "").length === 11 && dataNascimento !== "" && state.kind !== "loading" && state.kind !== "confirming";

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav active="/checkin" />

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        <div className="flex items-baseline gap-3">
          <h2 className="text-2xl font-bold text-gray-900">Check-in presencial</h2>
          <span className="text-sm text-gray-400">Informe o CPF e a data de nascimento do corredor.</span>
        </div>

        {/* Busca */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">CPF</label>
              <input
                ref={cpfRef}
                type="text"
                value={cpf}
                onChange={(e) => { setCpf(mascaraCpf(e.target.value)); if (state.kind !== "idle") setState({ kind: "idle" }); }}
                onKeyDown={(e) => { if (e.key === "Enter" && canVerify) handleVerificar(); }}
                placeholder="000.000.000-00"
                maxLength={14}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Data de nascimento</label>
              <input
                type="date"
                value={dataNascimento}
                onChange={(e) => { setDataNascimento(e.target.value); if (state.kind !== "idle") setState({ kind: "idle" }); }}
                onKeyDown={(e) => { if (e.key === "Enter" && canVerify) handleVerificar(); }}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <button
            onClick={handleVerificar}
            disabled={!canVerify}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {state.kind === "loading" ? "Verificando..." : "Verificar"}
          </button>
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
              <div><p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Nome</p><p className="font-semibold text-gray-900">{state.data.nome}</p></div>
              <div><p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Nº de peito</p><p className="font-semibold text-gray-900 font-mono">{state.data.numeroPeito ?? "—"}</p></div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Categoria</p>
                <p className="font-semibold text-gray-900">{state.data.categoria.nome} <span className="text-gray-400 font-normal text-sm">({state.data.categoria.percursoKm} km)</span></p>
              </div>
              <div><p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Camiseta</p><span className="text-xs font-mono font-semibold bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{state.data.tamanhoCamiseta}</span></div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Pagamento</p>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${state.data.pedidoStatus === "PAGO" ? "bg-emerald-100 text-emerald-700" : state.data.pedidoStatus === "AGUARDANDO_PAGAMENTO" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                  {STATUS_LABELS[state.data.pedidoStatus] ?? state.data.pedidoStatus}
                </span>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Check-in anterior</p>
                {state.data.checkinRealizadoEm ? (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                    {new Date(state.data.checkinRealizadoEm).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </span>
                ) : <span className="text-sm text-gray-400">Não realizado</span>}
              </div>
            </div>

            {state.data.categoria.tipo === "POLICIAL" && (
              <div className="mb-4 flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span><strong>Categoria Policial</strong> — validar comprovante de vínculo funcional presencialmente antes de confirmar.</span>
              </div>
            )}

            <div className="flex gap-3">
              {state.data.pedidoStatus === "PAGO" && !state.data.checkinRealizadoEm ? (
                <button onClick={handleConfirmar} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors">Confirmar Check-in</button>
              ) : state.data.checkinRealizadoEm ? (
                <p className="text-sm text-amber-700 font-medium">Este participante já realizou check-in.</p>
              ) : (
                <p className="text-sm text-red-700 font-medium">Check-in indisponível: pagamento não confirmado.</p>
              )}
              <button onClick={handleReset} className="px-4 py-2 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">Novo</button>
            </div>
          </div>
        )}

        {/* Sucesso */}
        {state.kind === "success" && (
          <div className="bg-white rounded-xl border border-gray-200 border-l-4 border-l-emerald-400 shadow-sm p-6">
            <p className="font-semibold text-emerald-700 text-base mb-1">Check-in registrado!</p>
            <p className="text-sm text-gray-600 mb-4">
              <span className="font-semibold text-gray-900">{state.nome}</span> — {state.categoria.nome} ({state.categoria.percursoKm} km)
              {state.numeroPeito != null && <> — Peito nº <span className="font-mono font-semibold">#{state.numeroPeito}</span></>}
            </p>
            <button onClick={handleReset} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors">Próximo corredor</button>
          </div>
        )}

        {/* Já fez check-in */}
        {state.kind === "already_done" && (
          <div className="bg-white rounded-xl border border-gray-200 border-l-4 border-l-amber-400 shadow-sm p-6">
            <p className="font-semibold text-amber-700 text-base mb-1">Check-in já realizado</p>
            <p className="text-sm text-gray-600 mb-4">
              <span className="font-semibold text-gray-900">{state.nome}</span> realizou check-in em{" "}
              {new Date(state.checkinRealizadoEm).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" })}.
            </p>
            <button onClick={handleReset} className="px-4 py-2 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">Novo corredor</button>
          </div>
        )}

        {/* Erro */}
        {state.kind === "error" && (
          <div className="bg-white rounded-xl border border-gray-200 border-l-4 border-l-red-400 shadow-sm p-6">
            <p className="font-semibold text-red-700 text-base mb-1">Não encontrado</p>
            <p className="text-sm text-gray-600 mb-4">{state.message}</p>
            <button onClick={handleReset} className="px-4 py-2 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">Tentar novamente</button>
          </div>
        )}

      </main>
    </div>
  );
}
