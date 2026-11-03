// Regras do vínculo entre o produtor e a balança dele.

// O id da balança sem separadores e em maiúsculas: "a4:cf:12:9b:07:e1" e "A4-CF-12-9B-07-E1" são a mesma balança.
export function normalizeDeviceId(deviceId: string): string {
  return deviceId.replace(/[^0-9a-z]/gi, "").toUpperCase();
}

// A chave única do par produtor + balança: os dois ids juntos. O jeito definitivo de gerar uma chave segura (por exemplo
// assinada pelo servidor) fica para quando o módulo existir; a tela só mostra a chave que o serviço devolve.
export function buildLinkKey(producerId: string, deviceId: string): string {
  const producer = producerId.replace(/[^0-9a-z]/gi, "").toUpperCase();
  return `P${producer}-B${normalizeDeviceId(deviceId)}`;
}

// Um código curto e estável para o produtor, tirado do e-mail, enquanto o servidor não manda o id de verdade.
export function producerRef(email: string): string {
  let hash = 0;
  for (const char of email.trim().toLowerCase()) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return hash.toString(36).toUpperCase().padStart(6, "0").slice(0, 6);
}

// O nome mais longo que o produtor pode dar à balança.
export const MAX_SCALE_NAME_LENGTH = 30;

// O nome que o produtor digitou, arrumado: sem espaços sobrando e no máximo 30 letras. Vazio volta ao nome original.
export function cleanScaleName(text: string): string | null {
  const cleaned = text.replace(/\s+/g, " ").trim().slice(0, MAX_SCALE_NAME_LENGTH).trim();
  return cleaned === "" ? null : cleaned;
}

// O nome que aparece na tela: o que o produtor escolheu ou, sem ele, o da balança.
export function scaleDisplayName(scale: { deviceName: string; nickname: string | null }): string {
  return scale.nickname ?? scale.deviceName;
}

// O endereço MAC da balança tem 12 letras/números (A4:CF:12:9B:07:E1).
export function isValidDeviceId(deviceId: string): boolean {
  return /^[0-9A-F]{12}$/.test(normalizeDeviceId(deviceId));
}

// Máscara enquanto a pessoa digita o endereço: "a4cf129" → "A4:CF:12:9".
export function maskDeviceId(text: string): string {
  const hex = text.replace(/[^0-9a-f]/gi, "").toUpperCase().slice(0, 12);
  return hex.match(/.{1,2}/g)?.join(":") ?? "";
}

// O código da etiqueta tem 8 letras/números e aparece como K7M2-Q9XT.
export const PAIRING_CODE_LENGTH = 8;

export function normalizePairingCode(text: string): string {
  return text.replace(/[^0-9a-z]/gi, "").toUpperCase().slice(0, PAIRING_CODE_LENGTH);
}

export function maskPairingCode(text: string): string {
  const code = normalizePairingCode(text);
  return code.length > 4 ? `${code.slice(0, 4)}-${code.slice(4)}` : code;
}

export function isValidPairingCode(text: string): boolean {
  return normalizePairingCode(text).length === PAIRING_CODE_LENGTH;
}

// A etiqueta também pode vir como texto de QR Code: "RC:A4CF129B07E1:K7M2Q9XT". Devolve os dois campos, ou null se não for isso.
export function parseLabelText(text: string): { deviceId: string; code: string } | null {
  const match = /^RC:([0-9A-F:.\- ]+):([0-9A-Z-]+)$/i.exec(text.trim());
  if (!match || !isValidDeviceId(match[1]) || !isValidPairingCode(match[2])) return null;
  return { deviceId: maskDeviceId(match[1]), code: maskPairingCode(match[2]) };
}

// O nome provisório de uma balança que ainda não foi vinculada (o servidor devolve o verdadeiro ao vincular).
export function provisionalScaleName(deviceId: string): string {
  return `Balança ${normalizeDeviceId(deviceId).slice(-4)}`;
}
