// Conferência de tokens JWT (HS256) com a Web Crypto: roda igual no proxy e nas rotas da API, sem
// depender de pacote. O token é criado em /api/auth/login (jsonwebtoken); aqui ele só é lido e a assinatura conferida.

export type Role = "admin" | "produtor" | "mercado";

export interface SessionPayload {
  email: string;
  role: Role;
  nome: string;
  status: string;
}

// Mesmo valor usado no login. O valor fixo abaixo só serve para desenvolvimento local e testes: qualquer pessoa que leia
// o código o conhece e assinaria um token de administrador. Em produção, sem JWT_SECRET, o site recusa funcionar
// (falha fechada) em vez de aceitar tokens forjados.
const DEV_SECRET = "chave-secreta-super-segura-raiz-conecta";

type Env = Record<string, string | undefined>;

export function resolveJwtSecret(env: Env): string {
  const configured = env.JWT_SECRET?.trim();
  if (configured) return configured;
  if (env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET não está configurada. Defina a variável de ambiente (mínimo 32 caracteres) para o site aceitar logins.");
  }
  return DEV_SECRET;
}

export function getJwtSecret(): string {
  return resolveJwtSecret(process.env);
}

const ROLES: readonly string[] = ["admin", "produtor", "mercado"];
const encoder = new TextEncoder();

function base64UrlToBytes(value: string): Uint8Array {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function parseJson(bytes: Uint8Array): unknown {
  return JSON.parse(new TextDecoder().decode(bytes));
}

// Devolve os dados do token ou `null` se a assinatura não bate, o token expirou ou algo está malformado.
export async function verifyToken(token: string, secret: string = getJwtSecret()): Promise<SessionPayload | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, payload, signature] = parts;

    const head = parseJson(base64UrlToBytes(header)) as { alg?: string };
    if (head.alg !== "HS256") return null;

    const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
      "verify",
    ]);
    const signatureBytes = base64UrlToBytes(signature);
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes.buffer.slice(signatureBytes.byteOffset, signatureBytes.byteOffset + signatureBytes.byteLength) as ArrayBuffer,
      encoder.encode(`${header}.${payload}`),
    );
    if (!valid) return null;

    const data = parseJson(base64UrlToBytes(payload)) as Partial<SessionPayload> & { exp?: number };
    if (typeof data.exp === "number" && data.exp * 1000 <= Date.now()) return null;
    if (typeof data.email !== "string" || typeof data.role !== "string" || !ROLES.includes(data.role)) return null;

    return {
      email: data.email,
      role: data.role as Role,
      nome: typeof data.nome === "string" ? data.nome : "",
      status: typeof data.status === "string" ? data.status : "",
    };
  } catch {
    return null;
  }
}
