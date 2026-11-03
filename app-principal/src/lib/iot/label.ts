import { isValidDeviceId, normalizeDeviceId } from "./deviceId";

// Regras de tela da balança do produtor (mesmas do app: app-mobile/src/lib/delivery/scaleLink.ts). Só texto, sem
// segredo: rodam no navegador. Quem confere o código de verdade é o servidor (lib/iot/pairing).

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

export const PAIRING_CODE_LENGTH = 8;

// O nome que aparece: o que o produtor escolheu ou, sem ele, o de fábrica.
export const scaleDisplayName = (scale: Pick<ScaleLink, "deviceName" | "nickname">) => scale.nickname ?? scale.deviceName;

export const isActiveScale = (state: ScaleState, scale: ScaleLink) =>
  state.activeDeviceId !== null && normalizeDeviceId(state.activeDeviceId) === normalizeDeviceId(scale.deviceId);

// Máscara enquanto a pessoa digita o endereço: "a4cf129" → "A4:CF:12:9".
export function maskDeviceId(text: string): string {
  const hex = text.replace(/[^0-9a-f]/gi, "").toUpperCase().slice(0, 12);
  return hex.match(/.{1,2}/g)?.join(":") ?? "";
}

export function normalizePairingCode(text: string): string {
  return text.replace(/[^0-9a-z]/gi, "").toUpperCase().slice(0, PAIRING_CODE_LENGTH);
}

// Como na etiqueta: K7M2-Q9XT.
export function maskPairingCode(text: string): string {
  const code = normalizePairingCode(text);
  return code.length > 4 ? `${code.slice(0, 4)}-${code.slice(4)}` : code;
}

export const isValidPairingCode = (text: string) => normalizePairingCode(text).length === PAIRING_CODE_LENGTH;

// O texto do QR Code da etiqueta: "RC:A4CF129B07E1:K7M2Q9XT". Devolve os dois campos, ou null se não for isso.
export function parseLabelText(text: string): { deviceId: string; code: string } | null {
  const match = /^RC:([0-9A-F:.\- ]+):([0-9A-Z-]+)$/i.exec(text.trim());
  if (!match || !isValidDeviceId(match[1]) || !isValidPairingCode(match[2])) return null;
  return { deviceId: maskDeviceId(match[1]), code: maskPairingCode(match[2]) };
}

// Confere os dois campos do formulário antes de mandar ao servidor. `null` = pode enviar.
export function labelError(deviceId: string, code: string): string | null {
  if (!isValidDeviceId(deviceId)) return "Digite o endereço completo da balança: 12 letras e números, como A4:CF:12:9B:07:E1.";
  if (!isValidPairingCode(code)) return "Digite o código da etiqueta: 8 letras e números, como K7M2-Q9XT.";
  return null;
}

// A linha da balança no Mais.
export function scaleRowHint(activeName: string | null, count: number): string {
  if (activeName) return `Conectada: ${activeName}`;
  return count > 0 ? "Nenhuma conectada. Escolha uma." : "Não conectada. Conecte com os dados da etiqueta.";
}
