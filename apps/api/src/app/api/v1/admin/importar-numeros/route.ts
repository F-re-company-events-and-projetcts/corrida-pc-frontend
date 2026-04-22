import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@corrida/db";
import bcrypt from "bcryptjs";
import Papa from "papaparse";
import * as XLSX from "xlsx";

function getToken(req: NextRequest): string | null {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  return auth.slice(7);
}

function mascaraCpf(cpf: string): string {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return "***.***.***-**";
  return `***.${digits.slice(3, 6)}.${digits.slice(6, 9)}-**`;
}

function normalizarNomeColuna(col: string): string {
  return col.trim().toLowerCase().replace(/[\s_-]/g, "").normalize("NFD").replace(/[̀-ͯ]/g, "");
}

interface LinhaInput {
  cpf: string;
  numeroPeito: number;
}

function extrairLinhas(rows: Record<string, unknown>[]): { linhas: LinhaInput[]; erro: string | null } {
  if (rows.length === 0) return { linhas: [], erro: "Planilha vazia" };

  const primeiraLinha = rows[0];
  const colunas = Object.keys(primeiraLinha);

  let colCpf: string | null = null;
  let colNumero: string | null = null;

  const cpfVariants = ["cpf"];

  for (const col of colunas) {
    const norm = normalizarNomeColuna(col);
    if (cpfVariants.includes(norm)) colCpf = col;
    if (
      norm === "numerodepeito" ||
      norm === "numeropito" ||
      norm === "numeroperito" ||
      norm === "numerodepito" ||
      norm === "peito" ||
      norm === "numeropeitol" ||
      norm === "num" ||
      norm === "npeito"
    ) {
      colNumero = col;
    }
  }

  // broader fallback matching
  if (!colCpf) {
    for (const col of colunas) {
      const norm = normalizarNomeColuna(col);
      if (norm.includes("cpf")) { colCpf = col; break; }
    }
  }
  if (!colNumero) {
    for (const col of colunas) {
      const norm = normalizarNomeColuna(col);
      if (norm.includes("peito") || norm.includes("numero") || norm.includes("num")) { colNumero = col; break; }
    }
  }

  if (!colCpf) return { linhas: [], erro: `Coluna CPF não encontrada. Colunas disponíveis: ${colunas.join(", ")}` };
  if (!colNumero) return { linhas: [], erro: `Coluna numeroPeito não encontrada. Colunas disponíveis: ${colunas.join(", ")}` };

  const linhas: LinhaInput[] = [];
  for (const row of rows) {
    const cpfRaw = String(row[colCpf!] ?? "").trim();
    const numeroRaw = row[colNumero!];
    if (!cpfRaw && !numeroRaw) continue;
    const numero = Number(numeroRaw);
    if (!cpfRaw || isNaN(numero) || !Number.isInteger(numero) || numero <= 0) continue;
    linhas.push({ cpf: cpfRaw.replace(/\D/g, ""), numeroPeito: numero });
  }

  return { linhas, erro: null };
}

async function parsePlanilha(buffer: Buffer, filename: string): Promise<{ rows: Record<string, unknown>[]; erro: string | null }> {
  const ext = filename.split(".").pop()?.toLowerCase();

  if (ext === "csv") {
    const text = buffer.toString("utf-8");
    const result = Papa.parse<Record<string, unknown>>(text, { header: true, skipEmptyLines: true });
    if (result.errors.length > 0 && result.data.length === 0) {
      return { rows: [], erro: `Erro ao parsear CSV: ${result.errors[0].message}` };
    }
    return { rows: result.data, erro: null };
  }

  if (ext === "xlsx" || ext === "xls") {
    try {
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
      return { rows, erro: null };
    } catch {
      return { rows: [], erro: "Erro ao ler arquivo XLSX" };
    }
  }

  return { rows: [], erro: `Formato não suportado: .${ext ?? "desconhecido"}. Use .csv ou .xlsx` };
}

export async function POST(req: NextRequest) {
  const token = getToken(req);
  if (!token) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const secret = new TextEncoder().encode(process.env.ADMIN_JWT_SECRET!);
    await jwtVerify(token, secret);
  } catch {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Esperado multipart/form-data" }, { status: 400 });
  }

  const file = formData.get("planilha");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Campo 'planilha' ausente ou inválido" }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const { rows, erro: erroParser } = await parsePlanilha(buffer, file.name);

  if (erroParser) {
    return NextResponse.json({ error: erroParser }, { status: 422 });
  }

  const { linhas, erro: erroExtracao } = extrairLinhas(rows);

  if (erroExtracao) {
    return NextResponse.json({ error: erroExtracao }, { status: 422 });
  }

  if (linhas.length > 1000) {
    return NextResponse.json({ error: "Máximo de 1000 linhas por importação" }, { status: 422 });
  }

  const todos = await prisma.participante.findMany({
    select: { id: true, cpf: true },
  });

  let processados = 0;
  let atualizados = 0;
  const erros: { linha: number; cpf_mascarado: string; motivo: string }[] = [];

  for (let i = 0; i < linhas.length; i++) {
    const { cpf, numeroPeito } = linhas[i];
    processados++;

    if (cpf.length !== 11) {
      erros.push({ linha: i + 2, cpf_mascarado: mascaraCpf(cpf), motivo: "CPF inválido (deve ter 11 dígitos)" });
      continue;
    }

    let participanteId: string | null = null;
    for (const p of todos) {
      const match = await bcrypt.compare(cpf, p.cpf);
      if (match) {
        participanteId = p.id;
        break;
      }
    }

    if (!participanteId) {
      erros.push({ linha: i + 2, cpf_mascarado: mascaraCpf(cpf), motivo: "CPF não encontrado no sistema" });
      continue;
    }

    await prisma.participante.update({
      where: { id: participanteId },
      data: { numeroPeito },
    });
    atualizados++;
  }

  return NextResponse.json({ processados, atualizados, erros });
}
