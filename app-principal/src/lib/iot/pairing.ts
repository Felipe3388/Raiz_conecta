import { createHmac } from "node:crypto";
import { getJwtSecret } from "@/lib/auth/jwt";
import { normalizeDeviceId } from "./deviceId";

// O código de pareamento vem impresso na etiqueta da balança. Só quem tem a balança na mão o conhece: o endereço MAC
// sozinho (que o módulo anuncia por Bluetooth/rede) não basta para uma conta tomar a balança de outra pessoa.
// Derivado do servidor (HMAC) e sem letras que se confundem (sem I, L, O, U): 8 símbolos = 40 bits.
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
export const CODE_LENGTH = 8;

export function pairingCode(deviceId: string): string {
  const mac = createHmac("sha256", getJwtSecret()).update(`pareamento|${normalizeDeviceId(deviceId)}`).digest();
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) code += ALPHABET[mac[i] % 32];
  return code;
}

// Como aparece na etiqueta: K7M2-9QX4.
export function formatCode(code: string): string {
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

// O que a pessoa digitou, arrumado: caixa alta, sem traço nem espaço; O vira 0 e I/L viram 1 (como na etiqueta).
export function normalizeCode(value: string): string {
  return value
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, "")
    .replace(/O/g, "0")
    .replace(/[IL]/g, "1");
}

export function codeMatches(typed: string, deviceId: string): boolean {
  return normalizeCode(typed) === pairingCode(deviceId);
}
