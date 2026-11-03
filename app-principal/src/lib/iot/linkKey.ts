import { createHmac } from "node:crypto";
import { getJwtSecret } from "@/lib/auth/jwt";
import { normalizeDeviceId } from "./deviceId";

// A chave do par produtor + balança que o app mostra como "vínculo". Assinada pelo servidor (HMAC): ninguém forja a de
// outro par sem o segredo do servidor. Estável: o mesmo par sempre gera a mesma chave.
export function linkKey(email: string, deviceId: string): string {
  const mac = createHmac("sha256", getJwtSecret())
    .update(`vinculo|${email.trim().toLowerCase()}|${normalizeDeviceId(deviceId)}`)
    .digest("hex");
  return `RC-${mac.slice(0, 20).toUpperCase()}`;
}
