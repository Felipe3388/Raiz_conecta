import type { Prisma } from "@prisma/client";
import { factoryName } from "./name";
import { generateSecret, hashSecret, secretMatches } from "./secret";

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

export type PairResult = { ok: true; secret: string } | { ok: false; reason: "outra-conta" };

interface PairInput {
  email: string;
  deviceId: string;
  firmware: string | null;
  // O segredo que o módulo ainda guarda de um pareamento anterior (prova de que quem pede está com a balança na mão).
  proof: string | null;
  now: Date;
}

// Vincula o módulo ao produtor e gera o segredo dele (devolvido uma única vez; no banco fica só o hash).
// - Balança nova: é registrada já no nome do produtor.
// - Balança livre (removida pelo dono ou liberada pelo admin) ou do próprio produtor: vale o novo pareamento.
// - Balança de OUTRA conta: só troca de dono se o módulo provar que é ele (apresenta o segredo antigo, que só um módulo que
//   ainda o guarda possui). Sem a prova, recusa: o dono atual precisa removê-la da conta antes.
// Em qualquer caso o segredo antigo deixa de valer e a balança vira a conectada do produtor.
export async function pairDevice(tx: Tx, { email, deviceId, firmware, proof, now }: PairInput): Promise<PairResult> {
  const secret = generateSecret();
  const data = { segredoHash: hashSecret(secret), ...(firmware ? { firmware } : {}) };
  const claim = { ...data, emailProdutor: email, vinculadaEm: now, apelido: null, conectada: false };

  const existing = await tx.balanca.findUnique({ where: { deviceId } });

  if (!existing) {
    await tx.balanca.create({ data: { deviceId, nome: factoryName(deviceId), ...claim } });
  } else if (existing.emailProdutor?.toLowerCase() === email.toLowerCase()) {
    // Mesmo dono (trocou de Wi-Fi, por exemplo): mantém apelido e data do vínculo.
    await tx.balanca.updateMany({ where: { deviceId, emailProdutor: sameOwner(email) }, data });
  } else {
    if (existing.emailProdutor !== null) {
      if (!proof || !secretMatches(proof, existing.segredoHash)) return { ok: false, reason: "outra-conta" };
      await releaseScale(tx, existing.id);
    }
    // Dois produtores disputando a mesma balança livre: um só vence.
    const claimed = await tx.balanca.updateMany({ where: { deviceId, emailProdutor: null }, data: claim });
    if (claimed.count === 0) return { ok: false, reason: "outra-conta" };
  }

  await activateScale(tx, email, deviceId);
  return { ok: true, secret };
}

// Solta a balança (do produtor ou pelo admin): volta a ficar livre e o histórico de pesagens daquele dono é apagado.
export async function releaseScale(tx: Tx, balancaId: string): Promise<void> {
  await tx.leituraPeso.deleteMany({ where: { balancaId } });
  await tx.balanca.update({
    where: { id: balancaId },
    data: { emailProdutor: null, apelido: null, conectada: false, vinculadaEm: null, ultimoKg: null, ultimoEstavel: false, ultimaLeitura: null },
  });
}
