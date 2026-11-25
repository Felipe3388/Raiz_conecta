import { randomBytes } from "node:crypto";
import { formatDeviceId } from "./deviceId";
import { isOnline } from "./readings";
import { hashSecret } from "./secret";
import { toScaleLink, type BalancaRow } from "./scales";

// Pareamento estilo lâmpada inteligente: o app pede um token ao servidor, entrega-o ao ESP32 pela rede da própria balança
// (Balanca_raiz_XXXX) e o ESP32 o apresenta ao servidor já conectado ao Wi-Fi do produtor. O token liga a balança àquele
// produtor; sem ele ninguém vincula uma balança a uma conta.

// Quanto tempo o produtor tem para entregar o token à balança e ela concluir (o fluxo todo leva 1 a 2 minutos).
export const PAIRING_TTL_MS = 15 * 60_000;
// Quantos pareamentos um produtor pode abrir em 15 minutos (impede encher a tabela).
export const MAX_PAIRINGS_PER_WINDOW = 10;
export const PAIRING_WINDOW_MS = 15 * 60_000;
// Um token já usado ainda vale para o MESMO módulo até expirar: se a resposta se perder no Wi-Fi, ele tenta de novo.

// 256 bits em hexadecimal: o mesmo formato do segredo do módulo.
export function generatePairingToken(): string {
  return randomBytes(32).toString("hex");
}

export const hashPairingToken = hashSecret;

export function isPairingTokenFormat(value: string): boolean {
  return /^[0-9a-f]{64}$/.test(value);
}

export type PairingState = "aguardando" | "vinculada" | "recusada" | "expirada";

export interface PairingRow {
  expiraEm: Date;
  usadoEm: Date | null;
  recusa: string | null;
}

// Em que pé está o pareamento, para o app mostrar o passo certo.
export function pairingState(row: PairingRow, now: Date = new Date()): PairingState {
  if (row.usadoEm) return "vinculada";
  if (row.recusa) return "recusada";
  return row.expiraEm.getTime() > now.getTime() ? "aguardando" : "expirada";
}

export const REFUSAL_OTHER_ACCOUNT = "outra-conta";

const REFUSAL_MESSAGES: Record<string, string> = {
  [REFUSAL_OTHER_ACCOUNT]: "Esta balança está vinculada a outra conta. Peça para o dono removê-la antes de adicionar aqui.",
};

// O que o app recebe de GET /api/produtor/balancas/pareamento/{id}. `pronta` = vinculada e já falando com o servidor.
export function pairingStatus(
  row: PairingRow,
  balanca: (BalancaRow & { ultimoContato: Date | null }) | null,
  email: string,
  now: Date = new Date(),
) {
  const owned = balanca?.emailProdutor?.toLowerCase() === email.toLowerCase();
  const state = pairingState(row, now);
  // Se a balança saiu da conta depois de vinculada (removida em outro aparelho), o pareamento não vale mais.
  const effective: PairingState = state === "vinculada" && !owned ? "expirada" : state;
  const online = effective === "vinculada" && isOnline(balanca?.ultimoContato, now);
  return {
    estado: effective,
    pronta: online,
    deviceId: balanca && effective === "vinculada" ? formatDeviceId(balanca.deviceId) : null,
    balanca: balanca && effective === "vinculada" ? toScaleLink({ ...balanca, conectada: balanca.conectada }, email) : null,
    mensagem: effective === "recusada" && row.recusa ? (REFUSAL_MESSAGES[row.recusa] ?? "A balança recusou o pareamento.") : null,
  };
}
