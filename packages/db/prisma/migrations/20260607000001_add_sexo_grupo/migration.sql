CREATE TYPE "Sexo" AS ENUM ('MASCULINO', 'FEMININO', 'OUTRO');

ALTER TABLE "Participante"
  ADD COLUMN "sexo" "Sexo" NOT NULL DEFAULT 'OUTRO',
  ADD COLUMN "grupoCorreida" TEXT;

-- Remove default after backfill (participantes existentes ficam como OUTRO)
ALTER TABLE "Participante" ALTER COLUMN "sexo" DROP DEFAULT;
