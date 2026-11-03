-- IoT: balanças do produtor (módulo ESP32 + célula de carga) e leituras estáveis.

-- CreateTable
CREATE TABLE "balancas" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "segredoHash" TEXT NOT NULL,
    "emailProdutor" TEXT,
    "apelido" TEXT,
    "conectada" BOOLEAN NOT NULL DEFAULT false,
    "vinculadaEm" TIMESTAMP(3),
    "firmware" TEXT,
    "ultimoContato" TIMESTAMP(3),
    "ultimoKg" DOUBLE PRECISION,
    "ultimoEstavel" BOOLEAN NOT NULL DEFAULT false,
    "ultimaLeitura" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "balancas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leituras_peso" (
    "id" SERIAL NOT NULL,
    "balancaId" TEXT NOT NULL,
    "kg" DOUBLE PRECISION NOT NULL,
    "medidoEm" TIMESTAMP(3) NOT NULL,
    "recebidoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leituras_peso_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "balancas_deviceId_key" ON "balancas"("deviceId");

-- CreateIndex
CREATE INDEX "balancas_emailProdutor_idx" ON "balancas"("emailProdutor");

-- CreateIndex
CREATE INDEX "leituras_peso_balancaId_medidoEm_idx" ON "leituras_peso"("balancaId", "medidoEm");

-- Um produtor tem no máximo UMA balança conectada (o Prisma não descreve índice parcial; é só no SQL).
CREATE UNIQUE INDEX "balancas_uma_conectada_por_produtor" ON "balancas"("emailProdutor") WHERE "conectada" = true;

-- AddForeignKey
ALTER TABLE "leituras_peso" ADD CONSTRAINT "leituras_peso_balancaId_fkey" FOREIGN KEY ("balancaId") REFERENCES "balancas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
