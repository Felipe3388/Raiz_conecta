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
