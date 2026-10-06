import type { TokenPayload } from "@/types/auth";

// Apenas lê o payload para restaurar a sessão. Quem valida a assinatura é o servidor.
export function decodeToken(token: string): TokenPayload | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  try {
    const payload: unknown = JSON.parse(decodeBase64Url(parts[1]));
    return isTokenPayload(payload) ? payload : null;
  } catch {
    return null;
  }
}

function decodeBase64Url(value: string): string {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const binary = atob(padded);
  // Converte os bytes UTF-8 em texto sem depender de TextDecoder (ausente em alguns runtimes).
  const percentEncoded = Array.from(binary, (char) =>
    `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`,
  ).join("");
  return decodeURIComponent(percentEncoded);
}

function isTokenPayload(value: unknown): value is TokenPayload {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.email === "string" &&
    typeof v.role === "string" &&
    typeof v.nome === "string" &&
    typeof v.status === "string" &&
    typeof v.exp === "number"
  );
}
