import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Categorias
  await prisma.categoria.upsert({
    where: { id: "cat-4km-cidadao" },
    update: { temPodio: false },
    create: {
      id: "cat-4km-cidadao",
      nome: "4KM Cidadão",
      percursoKm: 4,
      tipo: "CIDADAO",
      temPodio: false,
      vagasTotal: 150,
      vagasOcupadas: 0,
    },
  });

  await prisma.categoria.upsert({
    where: { id: "cat-4km-policial" },
    update: { temPodio: false },
    create: {
      id: "cat-4km-policial",
      nome: "4KM Policial",
      percursoKm: 4,
      tipo: "POLICIAL",
      temPodio: false,
      vagasTotal: 150,
      vagasOcupadas: 0,
    },
  });

  await prisma.categoria.upsert({
    where: { id: "cat-10km-cidadao" },
    update: {},
    create: {
      id: "cat-10km-cidadao",
      nome: "10KM Cidadão",
      percursoKm: 10,
      tipo: "CIDADAO",
      vagasTotal: 150,
      vagasOcupadas: 0,
    },
  });

  await prisma.categoria.upsert({
    where: { id: "cat-10km-policial" },
    update: {},
    create: {
      id: "cat-10km-policial",
      nome: "10KM Policial",
      percursoKm: 10,
      tipo: "POLICIAL",
      vagasTotal: 150,
      vagasOcupadas: 0,
    },
  });

  // Lotes
  await prisma.lote.upsert({
    where: { id: "lote-1" },
    update: { precoCidadao: 85.0, dataFim: new Date("2026-07-31T23:59:59Z") },
    create: {
      id: "lote-1",
      nome: "1º Lote",
      precoCidadao: 85.0,
      ativo: true,
      dataInicio: new Date("2026-01-01T00:00:00Z"),
      dataFim: new Date("2026-07-31T23:59:59Z"),
    },
  });

  await prisma.lote.upsert({
    where: { id: "lote-2" },
    update: { precoCidadao: 90.0 },
    create: {
      id: "lote-2",
      nome: "2º Lote",
      precoCidadao: 90.0,
      ativo: false,
      dataInicio: new Date("2026-08-01T00:00:00Z"),
      dataFim: new Date("2026-09-20T23:59:59Z"),
    },
  });

  console.log("Seed concluído: 4 categorias e 2 lotes criados.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
