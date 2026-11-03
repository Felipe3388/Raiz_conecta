import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

// O segredo do módulo (a "senha" que o ESP32 usa). Aleatório e longo: por isso um SHA-256 simples basta para guardá-lo
// (não é uma senha de gente, que pode ser fraca e pede bcrypt). Só o hash fica no banco.
export function generateSecret(): string {
  return randomBytes(32).toString("hex");
}

export function hashSecret(secret: string): string {
  return createHash("sha256").update(secret).digest("hex");
}

// Comparação em tempo constante: o tempo da resposta não revela quantas letras do segredo estavam certas.
export function secretMatches(secret: string, storedHash: string): boolean {
  const given = Buffer.from(hashSecret(secret), "hex");
  const stored = Buffer.from(storedHash, "hex");
  return given.length === stored.length && timingSafeEqual(given, stored);
}
