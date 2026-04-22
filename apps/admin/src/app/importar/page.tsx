"use client";

import { useState, useRef, ChangeEvent } from "react";

interface ErroLinha {
  linha: number;
  cpf_mascarado: string;
  motivo: string;
}

interface ImportResult {
  processados: number;
  atualizados: number;
  erros: ErroLinha[];
}

interface PreviewRow {
  [key: string]: string | number;
}

type PageState =
  | { kind: "idle" }
  | { kind: "preview"; rows: PreviewRow[]; totalRows: number; file: File }
  | { kind: "uploading" }
  | { kind: "result"; result: ImportResult }
  | { kind: "error"; message: string };

function parseCSVPreview(text: string): PreviewRow[] {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  return lines.slice(1, 6).map((line) => {
    const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    const row: PreviewRow = {};
    headers.forEach((h, i) => { row[h] = values[i] ?? ""; });
    return row;
  });
}

async function parseXLSXPreview(file: File): Promise<PreviewRow[]> {
  const { read, utils } = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const workbook = read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = utils.sheet_to_json<PreviewRow>(sheet, { defval: "" });
  return rows.slice(0, 5);
}

export default function ImportarPage() {
  const [state, setState] = useState<PageState>({ kind: "idle" });
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "csv" && ext !== "xlsx" && ext !== "xls") {
      setState({ kind: "error", message: "Apenas arquivos .csv e .xlsx são aceitos." });
      return;
    }

    try {
      let rows: PreviewRow[] = [];
      let totalRows = 0;

      if (ext === "csv") {
        const text = await file.text();
        rows = parseCSVPreview(text);
        const lines = text.split(/\r?\n/).filter(Boolean);
        totalRows = Math.max(0, lines.length - 1);
      } else {
        const { read, utils } = await import("xlsx");
        const buffer = await file.arrayBuffer();
        const workbook = read(buffer, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const allRows = utils.sheet_to_json<PreviewRow>(sheet, { defval: "" });
        totalRows = allRows.length;
        rows = allRows.slice(0, 5);
      }

      setState({ kind: "preview", rows, totalRows, file });
    } catch {
      setState({ kind: "error", message: "Não foi possível ler o arquivo. Verifique se está corrompido." });
    }
  }

  async function handleImportar() {
    if (state.kind !== "preview") return;
    const { file } = state;

    setState({ kind: "uploading" });

    try {
      const formData = new FormData();
      formData.append("planilha", file);

      const res = await fetch("/api/importar", {
        method: "POST",
        body: formData,
      });

      const data = await res.json() as Record<string, unknown>;

      if (!res.ok) {
        setState({ kind: "error", message: (data.error as string) ?? "Erro ao importar planilha." });
        return;
      }

      setState({ kind: "result", result: data as unknown as ImportResult });
    } catch {
      setState({ kind: "error", message: "Falha de rede. Verifique sua conexão." });
    }
  }

  function handleReset() {
    setState({ kind: "idle" });
    if (inputRef.current) inputRef.current.value = "";
  }

  const navLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/participantes", label: "Participantes" },
    { href: "/checkin", label: "Check-in" },
    { href: "/importar", label: "Importar números" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">
            Corrida do Policial Civil — Admin
          </h1>
          <nav className="flex items-center gap-6 text-sm">
            {navLinks.map(({ href, label }) => (
              <a
                key={href}
                href={href}
                className={
                  href === "/importar"
                    ? "font-semibold text-gray-900"
                    : "text-gray-600 hover:text-gray-900 transition-colors"
                }
                aria-current={href === "/importar" ? "page" : undefined}
              >
                {label}
              </a>
            ))}
            <a href="/logout" className="text-gray-500 hover:text-red-600 transition-colors">
              Sair
            </a>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-8 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Importar números de peito</h2>
        <p className="text-sm text-gray-500 mb-8">
          Envie um arquivo CSV ou XLSX com colunas <code className="bg-gray-100 px-1 rounded">cpf</code> e{" "}
          <code className="bg-gray-100 px-1 rounded">numeroPeito</code>. Máximo de 1000 linhas.
        </p>

        {/* Upload */}
        {(state.kind === "idle" || state.kind === "error") && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Arquivo da planilha
            </label>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
            />
            {state.kind === "error" && (
              <p className="mt-3 text-sm text-red-600">{state.message}</p>
            )}
          </div>
        )}

        {/* Preview */}
        {state.kind === "preview" && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-700">
                Preview — primeiras {Math.min(5, state.rows.length)} de {state.totalRows} linhas
              </h3>
              <span className="text-xs text-gray-400">{state.file.name}</span>
            </div>

            {state.rows.length > 0 ? (
              <div className="overflow-x-auto mb-6">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      {Object.keys(state.rows[0]).map((col) => (
                        <th
                          key={col}
                          className="text-left px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide border-b border-gray-200"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {state.rows.map((row, i) => (
                      <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                        {Object.values(row).map((val, j) => (
                          <td key={j} className="px-3 py-2 text-gray-700 font-mono text-xs">
                            {String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-500 mb-6">Nenhuma linha com dados encontrada.</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleImportar}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Importar
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-800 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Uploading */}
        {state.kind === "uploading" && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center mb-6">
            <p className="text-sm text-gray-500">Processando importação...</p>
            <p className="text-xs text-gray-400 mt-1">
              Isso pode levar alguns segundos dependendo do tamanho da planilha.
            </p>
          </div>
        )}

        {/* Result */}
        {state.kind === "result" && (
          <div className="space-y-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wide mb-4">
                Resultado da importação
              </h3>
              <div className="grid grid-cols-3 gap-4 mb-2">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-3xl font-bold text-gray-900">{state.result.processados}</p>
                  <p className="text-xs text-gray-500 mt-1">Processados</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-3xl font-bold text-green-700">{state.result.atualizados}</p>
                  <p className="text-xs text-green-600 mt-1">Atualizados</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-3xl font-bold text-red-700">{state.result.erros.length}</p>
                  <p className="text-xs text-red-600 mt-1">Erros</p>
                </div>
              </div>
            </div>

            {state.result.erros.length > 0 && (
              <div className="bg-white rounded-xl border border-red-100 shadow-sm p-6">
                <h3 className="text-sm font-medium text-red-700 uppercase tracking-wide mb-3">
                  Linhas com erro
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-red-50">
                        <th className="text-left px-3 py-2 text-xs font-medium text-red-600 border-b border-red-100">
                          Linha
                        </th>
                        <th className="text-left px-3 py-2 text-xs font-medium text-red-600 border-b border-red-100">
                          CPF
                        </th>
                        <th className="text-left px-3 py-2 text-xs font-medium text-red-600 border-b border-red-100">
                          Motivo
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.result.erros.map((erro, i) => (
                        <tr key={i} className="border-b border-red-50">
                          <td className="px-3 py-2 font-mono text-xs text-gray-600">{erro.linha}</td>
                          <td className="px-3 py-2 font-mono text-xs text-gray-600">{erro.cpf_mascarado}</td>
                          <td className="px-3 py-2 text-xs text-gray-700">{erro.motivo}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <button
              onClick={handleReset}
              className="px-6 py-2 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-900 transition-colors"
            >
              Nova importação
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
