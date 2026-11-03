import type { Prisma } from "@prisma/client";

// Cliente do banco dentro de uma transação.
type Tx = Prisma.TransactionClient;

const sameOwner = (email: string) => ({ equals: email, mode: "insensitive" as const });

// Deixa só uma balança do produtor como a conectada (o banco também garante: índice único parcial).
// Devolve false se a balança não é dele.
export async function activateScale(tx: Tx, email: string, deviceId: string): Promise<boolean> {
  await tx.balanca.updateMany({
    where: { emailProdutor: sameOwner(email), conectada: true, NOT: { deviceId } },
    data: { conectada: false },
  });
  const done = await tx.balanca.updateMany({
    where: { deviceId, emailProdutor: sameOwner(email) },
    data: { conectada: true },
  });
  return done.count > 0;
}

export class AlreadyLinkedError extends Error {}

// Toma uma balança livre para o produtor e a deixa conectada. Dois produtores disputando a mesma balança: um só vence.
export async function claimScale(tx: Tx, email: string, deviceId: string, now: Date): Promise<void> {
  const claimed = await tx.balanca.updateMany({
    where: { deviceId, emailProdutor: null },
    data: { emailProdutor: email, vinculadaEm: now, apelido: null, conectada: false },
  });
  if (claimed.count === 0) throw new AlreadyLinkedError();
  await activateScale(tx, email, deviceId);
}

// Solta a balança (do produtor ou pelo admin): volta a ficar livre e o histórico de pesagens daquele dono é apagado.
export async function releaseScale(tx: Tx, balancaId: string): Promise<void> {
  await tx.leituraPeso.deleteMany({ where: { balancaId } });
  await tx.balanca.update({
    where: { id: balancaId },
    data: { emailProdutor: null, apelido: null, conectada: false, vinculadaEm: null, ultimoKg: null, ultimoEstavel: false, ultimaLeitura: null },
  });
}
