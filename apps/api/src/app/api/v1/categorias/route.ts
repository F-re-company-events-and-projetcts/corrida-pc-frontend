import { NextResponse } from "next/server";
import { prisma } from "@corrida/db";
import type { Categoria } from "@corrida/types";

export async function GET() {
  const now = new Date();

  const [categorias, loteAtivo] = await Promise.all([
    prisma.categoria.findMany({ orderBy: { nome: "asc" } }),
    prisma.lote.findFirst({
      where: {
        ativo: true,
        dataInicio: { lte: now },
        dataFim: { gte: now },
      },
    }),
  ]);

  const data: Categoria[] = categorias.map((cat) => ({
    id: cat.id,
    nome: cat.nome,
    percursoKm: cat.percursoKm,
    tipo: cat.tipo,
    vagasTotal: cat.vagasTotal,
    vagasOcupadas: cat.vagasOcupadas,
    vagasDisponiveis: cat.vagasTotal - cat.vagasOcupadas,
    precoAtual:
      cat.tipo === "POLICIAL"
        ? 80.0
        : loteAtivo?.precoCidadao ?? null,
  }));

  return NextResponse.json(data, {
    headers: { "Cache-Control": "public, max-age=30" },
  });
}
