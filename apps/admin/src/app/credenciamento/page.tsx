"use client";

import { useState, useRef } from "react";
import { AdminNav } from "@/components/AdminNav";

interface PreviewData {
  nome: string;
  numeroPeito: number | null;
  tamanhoCamiseta: string;
  checkinRealizadoEm: string | null;
  credencialRetiradaEm: string | null;
  categoria: { nome: string; percursoKm: number; tipo: string };
  pedidoStatus: string;
  participanteId: string;
}

type PageState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "preview"; data: PreviewData }
  | { kind: "confirming" }
  | { kind: "success"; nome: string; categoria: { nome: string; percursoKm: number }; tamanhoCamiseta: string }
  | { kind: "already_done"; nome: string; credencialRetiradaEm: string }
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

export default function CredenciamentoPage() {
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
      if (res.status === 404) {
        setState({ kind: "error", message: "Participante não encontrado. Verifique o CPF e a data de nascimento." });
        return;
      }
      if (!res.ok) {
        setState({ kind: "error", message: (data.error as string) ?? "Erro ao buscar participante." });
        return;
      }
      setState({ kind: "preview", data: data as unknown as PreviewData });
    } catch {
      setState({ kind: "error", message: "Falha de rede." });
    }
  }

  async function handleConfirmar() {
    if (state.kind !== "preview") return;
    setState({ kind: "confirming" });
    try {
      const res = await fetch(`/api/participantes/${state.data.participanteId}/credencial`, {
        method: "POST",
      });
      const data = await res.json() as Record<string, unknown>;
      if (res.status === 409) {
        setState({
          kind: "already_done",
          nome: data.nome as string,
          credencialRetiradaEm: data.credencialRetiradaEm as string,
        });
        return;
      }
      if (res.status === 422) {
        setState({ kind: "error", message: "Credenciamento indisponível: pagamento não confirmado." });
        return;
      }
      if (!res.ok) {
        setState({ kind: "error", message: (data.error as string) ?? "Erro ao registrar credencial." });
        return;
      }
      const updated = data as { nome: string; categoria: { nome: string; percursoKm: number }; tamanhoCamiseta: string };
      setState({ kind: "success", nome: updated.nome, categoria: updated.categoria, tamanhoCamiseta: updated.tamanhoCamiseta });
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

  const canVerify =
    cpf.replace(/\D/g, "").length === 11 &&
    dataNascimento !== "" &&
    state.kind !== "loading" &&
    state.kind !== "confirming";

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav active="/credenciamento" />

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        <div className="flex items-baseline gap-3">
          <h2 className="text-2xl font-bold text-gray-900">Credenciamento — Retirada de Kit</h2>
          <span className="text-sm text-gray-400">26/Set/2026 — Informe o CPF e a data de nascimento.</span>
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

        {/* Registrando */}
        {state.kind === "confirming" && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 text-center text-sm text-gray-500">
            Registrando retirada de kit...
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
                  {state.data.categoria.nome}{" "}
                  <span className="text-gray-400 font-normal text-sm">({state.data.categoria.percursoKm} km)</span>
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Camiseta</p>
                <span className="text-xs font-mono font-semibold bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                  {state.data.tamanhoCamiseta}
                </span>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Pagamento</p>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    state.data.pedidoStatus === "PAGO"
                      ? "bg-emerald-100 text-emerald-700"
                      : state.data.pedidoStatus === "AGUARDANDO_PAGAMENTO"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {STATUS_LABELS[state.data.pedidoStatus] ?? state.data.pedidoStatus}
                </span>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Credencial anterior</p>
                {state.data.credencialRetiradaEm ? (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                    {new Date(state.data.credencialRetiradaEm).toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                ) : (
                  <span className="text-sm text-gray-400">Não retirada</span>
                )}
              </div>
            </div>

            {/* Badge policial */}
            {state.data.categoria.tipo === "POLICIAL" && (
              <div className="mb-4 flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span><strong>Categoria Policial</strong> — verificar documento funcional antes de entregar o kit.</span>
              </div>
            )}

            <div className="flex gap-3">
              {state.data.credencialRetiradaEm ? (
                <p className="text-sm text-gray-500 font-medium">
                  Kit entregue em{" "}
                  {new Date(state.data.credencialRetiradaEm).toLocaleString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}.
                </p>
              ) : state.data.pedidoStatus === "PAGO" ? (
                <button
                  onClick={handleConfirmar}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                  Registrar Retirada do Kit
                </button>
              ) : (
                <p className="text-sm text-red-700 font-medium">
                  Credenciamento indisponível: pagamento não confirmado.
                </p>
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
          <div className="bg-white rounded-xl border border-gray-200 border-l-4 border-l-indigo-400 shadow-sm p-6">
            <p className="font-semibold text-indigo-700 text-base mb-1">Kit entregue!</p>
            <p className="text-sm text-gray-600 mb-4">
              <span className="font-semibold text-gray-900">{state.nome}</span> —{" "}
              {state.categoria.nome} ({state.categoria.percursoKm} km) —{" "}
              Camiseta{" "}
              <span className="font-mono font-semibold">{state.tamanhoCamiseta}</span>
            </p>
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              Próximo participante
            </button>
          </div>
        )}

        {/* Credencial já retirada */}
        {state.kind === "already_done" && (
          <div className="bg-white rounded-xl border border-gray-200 border-l-4 border-l-gray-400 shadow-sm p-6">
            <p className="font-semibold text-gray-700 text-base mb-1">Kit já retirado</p>
            <p className="text-sm text-gray-600 mb-4">
              <span className="font-semibold text-gray-900">{state.nome}</span> retirou o kit em{" "}
              {new Date(state.credencialRetiradaEm).toLocaleString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}.
            </p>
            <button
              onClick={handleReset}
              className="px-4 py-2 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Novo participante
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
