-- IoT: pareamento da balança pelo app (estilo lâmpada inteligente). O token que o app entrega ao ESP32 vale por poucos
-- minutos; só o hash dele fica no banco.

-- CreateTable
CREATE TABLE "pareamentos_balanca" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "emailProdutor" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "usadoEm" TIMESTAMP(3),
    "deviceId" TEXT,
    "recusa" TEXT,

    CONSTRAINT "pareamentos_balanca_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pareamentos_balanca_tokenHash_key" ON "pareamentos_balanca"("tokenHash");

-- CreateIndex
CREATE INDEX "pareamentos_balanca_emailProdutor_criadoEm_idx" ON "pareamentos_balanca"("emailProdutor", "criadoEm");
