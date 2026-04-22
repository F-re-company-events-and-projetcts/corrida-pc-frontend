"use client";

import { useState, useRef } from "react";

interface PreviewData {
  nome: string;
  numeroPeito: number;
  tamanhoCamiseta: string;
  checkinRealizadoEm: string | null;
  categoria: { nome: string; percursoKm: number };
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

      if (res.status === 404) {
        setState({ kind: "error", message: "Número de peito não encontrado." });
        return;
      }
      if (!res.ok) {
        setState({ kind: "error", message: (data.error as string) ?? "Erro ao buscar participante." });
        return;
      }

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
        setState({
          kind: "already_done",
          nome: data.nome as string,
          checkinRealizadoEm: data.checkinRealizadoEm as string,
        });
        return;
      }
      if (res.status === 422) {
        setState({ kind: "error", message: `Pagamento não confirmado (status: ${data.status ?? "desconhecido"}).` });
        return;
      }
      if (!res.ok) {
        setState({ kind: "error", message: (data.error as string) ?? "Erro ao registrar check-in." });
        return;
      }

      setState({
        kind: "success",
        nome: data.nome as string,
        categoria: data.categoria as { nome: string; percursoKm: number },
        numeroPeito: data.numeroPeito as number,
      });
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
      <header className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">
            Corrida do Policial Civil — Admin
          </h1>
          <nav className="flex items-center gap-6 text-sm">
            <a href="/dashboard" className="text-gray-600 hover:text-gray-900 transition-colors">
              Dashboard
            </a>
            <a href="/participantes" className="text-gray-600 hover:text-gray-900 transition-colors">
              Participantes
            </a>
            <a href="/checkin" className="font-semibold text-gray-900" aria-current="page">
              Check-in
            </a>
            <a href="/logout" className="text-gray-500 hover:text-red-600 transition-colors">
              Sair
            </a>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-8 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Check-in presencial</h2>
        <p className="text-sm text-gray-500 mb-8">
          Digite o número de peito do corredor para verificar e registrar o check-in.
        </p>

        {/* Input */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <label htmlFor="numeroPeito" className="block text-sm font-medium text-gray-700 mb-2">
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
              onChange={(e) => {
                setNumeroPeito(e.target.value);
                if (state.kind !== "idle") setState({ kind: "idle" });
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canVerify) handleVerificar();
              }}
              placeholder="Ex: 42"
              className="w-40 border border-gray-300 rounded-lg px-4 py-2 text-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <button
              onClick={handleVerificar}
              disabled={!canVerify}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {state.kind === "loading" ? "Verificando..." : "Verificar"}
            </button>
          </div>
        </div>

        {/* Preview */}
        {state.kind === "preview" && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
            <h3 className="text-sm font-medium text-gray-500 mb-4 uppercase tracking-wide">
              Dados do participante
            </h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Nome</p>
                <p className="font-semibold text-gray-900">{state.data.nome}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Nº de peito</p>
                <p className="font-semibold text-gray-900 font-mono">{state.data.numeroPeito ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Categoria</p>
                <p className="font-semibold text-gray-900">
                  {state.data.categoria.nome}
                  <span className="text-gray-400 font-normal text-sm ml-1">
                    ({state.data.categoria.percursoKm} km)
                  </span>
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Camiseta</p>
                <p className="font-semibold text-gray-900">{state.data.tamanhoCamiseta}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Pagamento</p>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    state.data.pedidoStatus === "PAGO"
                      ? "bg-green-100 text-green-800"
                      : state.data.pedidoStatus === "AGUARDANDO_PAGAMENTO"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {STATUS_LABELS[state.data.pedidoStatus] ?? state.data.pedidoStatus}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Check-in anterior</p>
                {state.data.checkinRealizadoEm ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                    Realizado em{" "}
                    {new Date(state.data.checkinRealizadoEm).toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                ) : (
                  <span className="text-gray-500 text-sm">Não realizado</span>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              {state.data.pedidoStatus === "PAGO" && !state.data.checkinRealizadoEm ? (
                <button
                  onClick={handleConfirmar}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  Confirmar Check-in
                </button>
              ) : state.data.checkinRealizadoEm ? (
                <p className="text-sm text-orange-700 font-medium">
                  Este participante já realizou check-in.
                </p>
              ) : (
                <p className="text-sm text-red-700 font-medium">
                  Check-in indisponível: pagamento não confirmado.
                </p>
              )}
              <button
                onClick={handleReset}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-800 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
              >
                Novo
              </button>
            </div>
          </div>
        )}

        {/* Sucesso */}
        {state.kind === "success" && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-green-900 text-lg">Check-in registrado!</p>
                <p className="text-green-800 mt-1">
                  <strong>{state.nome}</strong> — {state.categoria.nome} ({state.categoria.percursoKm} km) —
                  Peito nº <strong>{state.numeroPeito}</strong>
                </p>
              </div>
            </div>
            <button
              onClick={handleReset}
              className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
            >
              Próximo corredor
            </button>
          </div>
        )}

        {/* Já fez check-in */}
        {state.kind === "already_done" && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-yellow-900 text-lg">Check-in já realizado</p>
                <p className="text-yellow-800 mt-1">
                  <strong>{state.nome}</strong> realizou check-in em{" "}
                  {new Date(state.checkinRealizadoEm).toLocaleString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                  .
                </p>
              </div>
            </div>
            <button
              onClick={handleReset}
              className="mt-4 px-6 py-2 bg-yellow-600 text-white rounded-lg text-sm font-medium hover:bg-yellow-700 transition-colors"
            >
              Novo corredor
            </button>
          </div>
        )}

        {/* Erro */}
        {state.kind === "error" && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-red-900">Erro</p>
                <p className="text-red-800 mt-1">{state.message}</p>
              </div>
            </div>
            <button
              onClick={handleReset}
              className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {state.kind === "confirming" && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 text-center text-sm text-gray-500">
            Registrando check-in...
          </div>
        )}
      </main>
    </div>
  );
}
