import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const senha = await bcrypt.hash("admin123", 10);

  await prisma.adminUser.upsert({
    where: { email: "admin@corridapc.com.br" },
    update: {},
    create: {
      email: "admin@corridapc.com.br",
      senha,
      nome: "Administrador",
      role: "TOTAL",
    },
  });

  console.log("Seed admin concluído: admin@corridapc.com.br / admin123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
