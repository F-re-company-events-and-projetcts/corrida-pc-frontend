// Faixas etárias conforme regulamento — idade na data do evento (27/09/2026)
const EVENTO_DATA = new Date("2026-09-27T12:00:00Z");

/** Aceita ISO "2004-08-24" ou formato brasileiro "24/08/2004" */
function parseDateSafe(dataNascimento: string): Date {
  if (dataNascimento.includes("/")) {
    const [d, m, y] = dataNascimento.split("/").map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(dataNascimento);
}

export function idadeNoEvento(dataNascimento: string): number {
  const birth = parseDateSafe(dataNascimento);
  let age = EVENTO_DATA.getFullYear() - birth.getFullYear();
  if (
    EVENTO_DATA.getMonth() < birth.getMonth() ||
    (EVENTO_DATA.getMonth() === birth.getMonth() && EVENTO_DATA.getDate() < birth.getDate())
  ) age--;
  return age;
}

export function faixaEtaria(dataNascimento: string): string {
  const idade = idadeNoEvento(dataNascimento);
  if (idade < 16) return "< FX1";
  if (idade <= 29) return "FX1";
  if (idade <= 39) return "FX2";
  if (idade <= 49) return "FX3";
  if (idade <= 59) return "FX4";
  if (idade <= 64) return "FX5";
  return "FX6";
}

export function faixaEtariaCompleta(dataNascimento: string): string {
  const idade = idadeNoEvento(dataNascimento);
  if (idade < 16) return "Abaixo da idade mínima";
  if (idade <= 29) return "FX1 — 16 a 29 anos";
  if (idade <= 39) return "FX2 — 30 a 39 anos";
  if (idade <= 49) return "FX3 — 40 a 49 anos";
  if (idade <= 59) return "FX4 — 50 a 59 anos";
  if (idade <= 64) return "FX5 — 60 a 64 anos";
  return "FX6 — 65 anos ou mais";
}
