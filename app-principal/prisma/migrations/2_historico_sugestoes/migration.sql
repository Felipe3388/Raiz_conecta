-- Preserva o histórico das sugestões para mostrar o andamento real ao produtor.
-- Os registros existentes são classificados como EM_ANALISE;
-- sugestões aprovadas/removidas antes desta migração não podem ser recuperadas.
ALTER TABLE "sugestoes"
  ADD COLUMN "status" TEXT NOT NULL DEFAULT 'EM_ANALISE',
  ADD COLUMN "motivo" TEXT,
  ADD COLUMN "decididoEm" TIMESTAMP(3);

CREATE INDEX "sugestoes_emailProdutor_criadoEm_idx" ON "sugestoes"("emailProdutor", "criadoEm");
CREATE INDEX "sugestoes_status_idx" ON "sugestoes"("status");
