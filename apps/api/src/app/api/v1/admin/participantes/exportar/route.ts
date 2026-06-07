import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@corrida/db";
import * as XLSX from "xlsx";

function getToken(req: NextRequest): string | null {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  return auth.slice(7);
}

interface ExportRow {
  nome: string;
  email: string;
  telefone: string;
  categoria: string;
  percursoKm: number;
  camiseta: string;
  numeroPeito: number | null;
  numeroPedido: string;
  status: string;
  metodoPagamento: string;
  total: number;
  checkin: string | null;
  createdAt: string;
}

const STATUS_LABELS: Record<string, string> = {
  AGUARDANDO_PAGAMENTO: "Aguardando",
  PAGO: "Pago",
  RECUSADO: "Recusado",
  EXPIRADO: "Expirado",
  CANCELADO: "Cancelado",
};

function escapeCSV(val: string): string {
  return `"${val.replace(/"/g, '""')}"`;
}

function generateCSV(rows: ExportRow[]): string {
  const headers = [
    "Nome", "E-mail", "Telefone", "Categoria", "Percurso (km)",
    "Camiseta", "Nº Peito", "Pedido", "Status", "Pagamento",
    "Valor (R$)", "Check-in", "Data Inscrição",
  ];
  const lines = [headers.map(escapeCSV).join(",")];
  for (const row of rows) {
    lines.push([
      escapeCSV(row.nome),
      escapeCSV(row.email),
      escapeCSV(row.telefone),
      escapeCSV(row.categoria),
      String(row.percursoKm),
      escapeCSV(row.camiseta),
      row.numeroPeito != null ? String(row.numeroPeito) : "",
      escapeCSV(row.numeroPedido ?? ""),
      escapeCSV(STATUS_LABELS[row.status] ?? row.status),
      escapeCSV(row.metodoPagamento === "PIX" ? "PIX" : "Cartão"),
      row.total.toFixed(2).replace(".", ","),
      row.checkin ? escapeCSV(row.checkin) : "",
      escapeCSV(row.createdAt),
    ].join(","));
  }
  return "﻿" + lines.join("\r\n"); // BOM for Excel UTF-8 detection
}

function generateXLSX(rows: ExportRow[]): ArrayBuffer {
  const data = rows.map((row) => ({
    Nome: row.nome,
    "E-mail": row.email,
    Telefone: row.telefone,
    Categoria: row.categoria,
    "Percurso (km)": row.percursoKm,
    Camiseta: row.camiseta,
    "Nº Peito": row.numeroPeito ?? "",
    Pedido: row.numeroPedido ?? "",
    Status: STATUS_LABELS[row.status] ?? row.status,
    Pagamento: row.metodoPagamento === "PIX" ? "PIX" : "Cartão",
    "Valor (R$)": row.total,
    "Check-in": row.checkin ?? "",
    "Data Inscrição": row.createdAt,
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Participantes");
  const raw = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as number[];
  const buf = new ArrayBuffer(raw.length);
  new Uint8Array(buf).set(raw);
  return buf;
}

export async function GET(req: NextRequest) {
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

  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") === "xlsx" ? "xlsx" : "csv";
  const categoriaId = searchParams.get("categoria") ?? "";
  const status = searchParams.get("status") ?? "";
  const q = searchParams.get("q") ?? "";

  const where = {
    ...(categoriaId ? { categoriaId } : {}),
    ...(status ? { pedido: { status: status as never } } : {}),
    ...(q
      ? {
          OR: [
            { nome: { contains: q, mode: "insensitive" as const } },
            { email: { contains: q, mode: "insensitive" as const } },
            { pedido: { numeroPedido: { contains: q, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  const participantes = await prisma.participante.findMany({
    where,
    select: {
      nome: true,
      email: true,
      telefone: true,
      tamanhoCamiseta: true,
      numeroPeito: true,
      checkinRealizadoEm: true,
      createdAt: true,
      categoria: { select: { nome: true, percursoKm: true } },
      pedido: {
        select: {
          numeroPedido: true,
          status: true,
          metodoPagamento: true,
          total: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
    take: 10000,
  });

  const rows: ExportRow[] = participantes.map((p) => ({
    nome: p.nome,
    email: p.email,
    telefone: p.telefone,
    categoria: p.categoria.nome,
    percursoKm: p.categoria.percursoKm,
    camiseta: p.tamanhoCamiseta,
    numeroPeito: p.numeroPeito,
    numeroPedido: p.pedido.numeroPedido ?? "",
    status: p.pedido.status,
    metodoPagamento: p.pedido.metodoPagamento,
    total: p.pedido.total,
    checkin: p.checkinRealizadoEm
      ? new Date(p.checkinRealizadoEm).toLocaleString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : null,
    createdAt: new Date(p.createdAt).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
  }));

  const date = new Date().toISOString().slice(0, 10);

  if (format === "xlsx") {
    const buf = generateXLSX(rows);
    const blob = new Blob([buf], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    return new NextResponse(blob, {
      headers: {
        "Content-Disposition": `attachment; filename="participantes_${date}.xlsx"`,
      },
    });
  }

  const csv = generateCSV(rows);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="participantes_${date}.csv"`,
    },
  });
}
