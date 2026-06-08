-- AlterTable: Categoria — adiciona campo temPodio (INS-006)
ALTER TABLE "Categoria" ADD COLUMN "temPodio" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable: Participante — adiciona campo credencialRetiradaEm (INS-008)
ALTER TABLE "Participante" ADD COLUMN "credencialRetiradaEm" TIMESTAMP(3);
