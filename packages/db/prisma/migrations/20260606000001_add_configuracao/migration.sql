CREATE TABLE "Configuracao" (
  "chave"     TEXT NOT NULL,
  "valor"     TEXT NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Configuracao_pkey" PRIMARY KEY ("chave")
);

-- Valores padrão
INSERT INTO "Configuracao" ("chave", "valor", "updatedAt") VALUES
  ('PRECO_POLICIAL',   '80',  NOW()),
  ('TAXA_SERVICO_PCT', '10',  NOW())
ON CONFLICT ("chave") DO NOTHING;
