"use client";

import { useState } from "react";

const TAMANHOS = ["PP", "P", "M", "G", "GG", "XGG"] as const;

// Faixas etárias baseadas na idade na data do evento (27/09/2026)
const EVENTO_DATA = new Date("2026-09-27T12:00:00Z");

function calcularIdadeEvento(dataNascimento: string): number {
  const birth = new Date(dataNascimento);
  let age = EVENTO_DATA.getFullYear() - birth.getFullYear();
  if (
    EVENTO_DATA.getMonth() < birth.getMonth() ||
    (EVENTO_DATA.getMonth() === birth.getMonth() && EVENTO_DATA.getDate() < birth.getDate())
  ) age--;
  return age;
}

function getFaixaEtaria(dataNascimento: string): string {
  const idade = calcularIdadeEvento(dataNascimento);
  if (idade < 16) return "Abaixo da idade mínima";
  if (idade <= 29) return "FX1 — 16 a 29 anos";
  if (idade <= 39) return "FX2 — 30 a 39 anos";
  if (idade <= 49) return "FX3 — 40 a 49 anos";
  if (idade <= 59) return "FX4 — 50 a 59 anos";
  if (idade <= 64) return "FX5 — 60 a 64 anos";
  return "FX6 — 65 anos ou mais";
}

interface Participante {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  contatoEmergencia: string;
  tamanhoCamiseta: string;
  numeroPeito: number | null;
  checkinRealizadoEm: string | null;
  dataNascimento: string;
  createdAt: string;
  categoria: { id: string; nome: string; percursoKm: number; tipo: string };
  pedido: { id: string; numeroPedido: string; status: string; metodoPagamento: string; total: number };
}

const STATUS_LABELS: Record<string, string> = {
  AGUARDANDO_PAGAMENTO: "Aguardando",
  PAGO: "Pago",
  RECUSADO: "Recusado",
  EXPIRADO: "Expirado",
  CANCELADO: "Cancelado",
};

const STATUS_COLORS: Record<string, string> = {
  PAGO: "bg-emerald-100 text-emerald-700",
  AGUARDANDO_PAGAMENTO: "bg-amber-100 text-amber-700",
  RECUSADO: "bg-red-100 text-red-700",
  EXPIRADO: "bg-gray-100 text-gray-500",
  CANCELADO: "bg-red-100 text-red-700",
};

async function patchParticipante(id: string, body: Record<string, unknown>) {
  const res = await fetch(`/api/participantes/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { ok: res.ok, data: await res.json() as Record<string, unknown> };
}

export function EditParticipanteForm({ initial }: { initial: Participante }) {
  const [p, setP] = useState(initial);

  // Estado do formulário de dados
  const [form, setForm] = useState({
    nome: initial.nome,
    email: initial.email,
    telefone: initial.telefone,
    contatoEmergencia: initial.contatoEmergencia,
    tamanhoCamiseta: initial.tamanhoCamiseta,
  });
  const [savingDados, setSavingDados] = useState(false);
  const [msgDados, setMsgDados] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  // Estado do número de peito
  const [numeroPeitoInput, setNumeroPeitoInput] = useState(initial.numeroPeito?.toString() ?? "");
  const [savingPeito, setSavingPeito] = useState(false);
  const [msgPeito, setMsgPeito] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  // Estado do check-in
  const [savingCheckin, setSavingCheckin] = useState(false);
  const [msgCheckin, setMsgCheckin] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const idade = calcularIdadeEvento(p.dataNascimento);
  const faixaEtaria = getFaixaEtaria(p.dataNascimento);

  // --- Salvar dados gerais ---
  async function handleSaveDados(e: React.FormEvent) {
    e.preventDefault();
    setSavingDados(true);
    setMsgDados(null);
    const { ok, data } = await patchParticipante(p.id, form);
    setSavingDados(false);
    if (ok) {
      setP((prev) => ({ ...prev, ...form }));
      setMsgDados({ kind: "ok", text: "Dados salvos com sucesso." });
    } else {
      setMsgDados({ kind: "err", text: (data.error as string) ?? "Erro ao salvar." });
    }
  }

  // --- Salvar número de peito ---
  async function handleSavePeito(e: React.FormEvent) {
    e.preventDefault();
    setSavingPeito(true);
    setMsgPeito(null);
    const valor = numeroPeitoInput.trim();
    const numeroPeito = valor === "" ? null : parseInt(valor, 10);
    if (valor !== "" && (isNaN(numeroPeito!) || numeroPeito! <= 0)) {
      setMsgPeito({ kind: "err", text: "Número de peito inválido." });
      setSavingPeito(false);
      return;
    }
    const { ok, data } = await patchParticipante(p.id, { numeroPeito });
    setSavingPeito(false);
    if (ok) {
      setP((prev) => ({ ...prev, numeroPeito }));
      setMsgPeito({ kind: "ok", text: numeroPeito ? `Nº ${numeroPeito} salvo.` : "Número de peito removido." });
    } else {
      setMsgPeito({ kind: "err", text: (data.error as string) ?? "Erro ao salvar." });
    }
  }

  // --- Check-in ---
  async function handleCheckin(registrar: boolean) {
    setSavingCheckin(true);
    setMsgCheckin(null);
    const checkinRealizadoEm = registrar ? new Date().toISOString() : null;
    const { ok, data } = await patchParticipante(p.id, { checkinRealizadoEm });
    setSavingCheckin(false);
    if (ok) {
      setP((prev) => ({ ...prev, checkinRealizadoEm: data.checkinRealizadoEm as string | null }));
      setMsgCheckin({
        kind: "ok",
        text: registrar ? "Check-in registrado com sucesso." : "Check-in desfeito.",
      });
    } else {
      setMsgCheckin({ kind: "err", text: (data.error as string) ?? "Erro ao salvar." });
    }
  }

  return (
    <div className="space-y-6">

      {/* Resumo do pedido */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Pedido</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Número</p>
            <p className="font-mono font-medium text-gray-900">{p.pedido.numeroPedido}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Status</p>
            <span className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[p.pedido.status] ?? "bg-gray-100 text-gray-500"}`}>
              {STATUS_LABELS[p.pedido.status] ?? p.pedido.status}
            </span>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Categoria</p>
            <p className="text-gray-900">{p.categoria.nome}</p>
            {p.categoria.tipo === "POLICIAL" && (
              <p className="text-xs text-amber-700 font-medium mt-0.5">Validar comprovante</p>
            )}
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Idade (no evento)</p>
            <p className="text-gray-900">{idade} anos</p>
          </div>
          <div className="col-span-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Faixa etária</p>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
              {faixaEtaria}
            </span>
            <p className="text-xs text-gray-400 mt-1">Calculada com base na idade em 27/09/2026</p>
          </div>
        </div>
      </div>

      {/* Número de peito */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Número de peito</h3>
        <form onSubmit={handleSavePeito} className="space-y-3">
          {msgPeito && (
            <div className={`px-3 py-2 rounded-lg text-sm ${msgPeito.kind === "ok" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
              {msgPeito.text}
            </div>
          )}
          <div className="flex items-end gap-3">
            <div className="flex-1 max-w-xs">
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Número
              </label>
              <input
                type="number"
                min={1}
                value={numeroPeitoInput}
                onChange={(e) => setNumeroPeitoInput(e.target.value)}
                placeholder="Ex: 42"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-400">Deixe vazio para remover.</p>
            </div>
            <button
              type="submit"
              disabled={savingPeito}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {savingPeito ? "Salvando…" : "Salvar"}
            </button>
          </div>
          {p.numeroPeito != null && (
            <p className="text-sm text-gray-600">
              Atual: <span className="font-mono font-semibold text-gray-900">#{p.numeroPeito}</span>
            </p>
          )}
        </form>
      </div>

      {/* Check-in */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Check-in presencial</h3>

        {msgCheckin && (
          <div className={`mb-4 px-3 py-2 rounded-lg text-sm ${msgCheckin.kind === "ok" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
            {msgCheckin.text}
          </div>
        )}

        {p.categoria.tipo === "POLICIAL" && !p.checkinRealizadoEm && (
          <div className="mb-4 flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
            <span>⚠</span>
            <span><strong>Categoria Policial</strong> — validar comprovante de vínculo funcional antes de registrar o check-in.</span>
          </div>
        )}

        {p.pedido.status !== "PAGO" && (
          <div className="mb-4 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">
            Check-in indisponível — pagamento não confirmado ({STATUS_LABELS[p.pedido.status] ?? p.pedido.status}).
          </div>
        )}

        {p.checkinRealizadoEm ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-700">
                Check-in realizado em{" "}
                {new Date(p.checkinRealizadoEm).toLocaleString("pt-BR", {
                  day: "2-digit", month: "2-digit", year: "numeric",
                  hour: "2-digit", minute: "2-digit",
                })}
              </p>
            </div>
            <button
              onClick={() => handleCheckin(false)}
              disabled={savingCheckin}
              className="px-4 py-2 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              {savingCheckin ? "Desfazendo…" : "Desfazer check-in"}
            </button>
          </div>
        ) : (
          <button
            onClick={() => handleCheckin(true)}
            disabled={savingCheckin || p.pedido.status !== "PAGO"}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {savingCheckin ? "Registrando…" : "Registrar check-in agora"}
          </button>
        )}
      </div>

      {/* Dados editáveis */}
      <form onSubmit={handleSaveDados} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
        <h3 className="text-sm font-semibold text-gray-700">Dados do participante</h3>

        {msgDados && (
          <div className={`px-4 py-3 rounded-lg text-sm ${msgDados.kind === "ok" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
            {msgDados.text}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Nome completo</label>
            <input
              type="text"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">E-mail</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Telefone</label>
            <input
              type="text"
              value={form.telefone}
              onChange={(e) => setForm({ ...form, telefone: e.target.value.replace(/\D/g, "") })}
              maxLength={11}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Contato de emergência</label>
            <input
              type="text"
              value={form.contatoEmergencia}
              onChange={(e) => setForm({ ...form, contatoEmergencia: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Camiseta</label>
            <select
              value={form.tamanhoCamiseta}
              onChange={(e) => setForm({ ...form, tamanhoCamiseta: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {TAMANHOS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={savingDados}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {savingDados ? "Salvando…" : "Salvar dados"}
          </button>
        </div>
      </form>
    </div>
  );
}
