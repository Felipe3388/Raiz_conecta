// O peso ao vivo na tela (mesmo ritmo do app, ApiScaleService): pergunta ao servidor a cada 0,5 s enquanto a balança
// responde e a cada 2 s quando ela está sem sinal, para não gastar à toa.

export interface LiveReadingDto {
  online: boolean;
  kg: number | null;
  estavel: boolean;
  em: number | null;
  agora: number;
}

export type LiveStatus = "connecting" | "online" | "offline";

export interface LiveWeight {
  status: LiveStatus;
  kg: number | null;
  stable: boolean;
  // Quando o módulo mediu (relógio do servidor), para "há 3 s".
  measuredAt: number | null;
  serverNow: number | null;
}

export const POLL_ONLINE_MS = 500;
export const POLL_OFFLINE_MS = 2000;

export const INITIAL_LIVE_WEIGHT: LiveWeight = { status: "connecting", kg: null, stable: false, measuredAt: null, serverNow: null };

// Uma resposta do servidor (ou null, se a chamada falhou) vira o que a tela mostra e quando perguntar de novo.
export function applyReading(dto: LiveReadingDto | null): { weight: LiveWeight; nextInMs: number } {
  if (!dto || !dto.online || typeof dto.kg !== "number" || !Number.isFinite(dto.kg)) {
    return { weight: { status: "offline", kg: null, stable: false, measuredAt: dto?.em ?? null, serverNow: dto?.agora ?? null }, nextInMs: POLL_OFFLINE_MS };
  }
  return { weight: { status: "online", kg: dto.kg, stable: dto.estavel, measuredAt: dto.em, serverNow: dto.agora }, nextInMs: POLL_ONLINE_MS };
}

// 12,35 kg (3 casas entre 0 e 1 kg: 0,450 kg; balança vazia: 0,00 kg).
export function formatKg(kg: number): string {
  const digits = kg > 0 && kg < 1 ? 3 : 2;
  return `${kg.toLocaleString("pt-BR", { minimumFractionDigits: digits, maximumFractionDigits: digits })} kg`;
}
