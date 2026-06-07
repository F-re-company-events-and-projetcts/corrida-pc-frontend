import { prisma } from "@corrida/db";

/**
 * Reads PRECO_POLICIAL and TAXA_SERVICO_PCT from the Configuracao table.
 * Falls back to env vars, then to hardcoded defaults.
 */
export async function getConfiguracoesPricing(): Promise<{
  precoPolicial: number;
  taxaPct: number;
}> {
  const [cfgPolicial, cfgTaxa] = await Promise.all([
    prisma.configuracao.findUnique({ where: { chave: "PRECO_POLICIAL" } }),
    prisma.configuracao.findUnique({ where: { chave: "TAXA_SERVICO_PCT" } }),
  ]);

  return {
    precoPolicial: parseFloat(cfgPolicial?.valor ?? process.env.PRECO_POLICIAL ?? "80"),
    taxaPct: parseFloat(cfgTaxa?.valor ?? process.env.TAXA_SERVICO_PCT ?? "10"),
  };
}

/** Returns base price + service fee, rounded to 2 decimal places. */
export function comTaxa(precoBase: number, taxaPct: number): number {
  return Math.round(precoBase * (1 + taxaPct / 100) * 100) / 100;
}

/** Calculates final price for a category (synchronous, requires pre-fetched config). */
export function calcularPreco(
  tipo: "POLICIAL" | "CIDADAO",
  precoCidadaoBase: number | null,
  precoPolicial: number,
  taxaPct: number
): number | null {
  if (tipo === "POLICIAL") return comTaxa(precoPolicial, taxaPct);
  if (precoCidadaoBase === null) return null;
  return comTaxa(precoCidadaoBase, taxaPct);
}
