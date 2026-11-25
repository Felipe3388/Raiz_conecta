import { normalizeDeviceId } from "./deviceId";

// Regras de tela da balança do produtor (mesmas do app: app-mobile/src/lib/delivery/scaleLink.ts). Só texto, sem
// segredo: rodam no navegador. A balança entra na conta pelo pareamento feito no app (lib/iot/pairing).

// A balança como GET /api/produtor/balancas devolve (contrato ScaleLink do app).
export interface ScaleLink {
  deviceId: string;
  deviceName: string;
  nickname: string | null;
  key: string;
  linkedAt: string;
}

export interface ScaleState {
  scales: ScaleLink[];
  activeDeviceId: string | null;
}

// O nome que aparece: o que o produtor escolheu ou, sem ele, o de fábrica.
export const scaleDisplayName = (scale: Pick<ScaleLink, "deviceName" | "nickname">) => scale.nickname ?? scale.deviceName;

export const isActiveScale = (state: ScaleState, scale: ScaleLink) =>
  state.activeDeviceId !== null && normalizeDeviceId(state.activeDeviceId) === normalizeDeviceId(scale.deviceId);

// A linha da balança no Mais.
export function scaleRowHint(activeName: string | null, count: number): string {
  if (activeName) return `Conectada: ${activeName}`;
  return count > 0 ? "Nenhuma conectada. Escolha uma." : "Não conectada. Adicione pelo app.";
}
