import { NextResponse } from "next/server";
import { verifyToken, type Role, type SessionPayload } from "./jwt";

// O token vem do cabeçalho `Authorization: Bearer ...` (app mobile) ou do cookie `token` (site).
export function tokenFromRequest(req: Request): string | null {
  const header = req.headers.get("authorization");
  if (header) {
    const [scheme, value] = header.split(" ");
    if (scheme?.toLowerCase() === "bearer" && value) return value.trim();
  }

  const cookies = req.headers.get("cookie");
  if (!cookies) return null;
  for (const part of cookies.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === "token" && rest.length > 0) return decodeURIComponent(rest.join("="));
  }
  return null;
}

export async function getSession(req: Request): Promise<SessionPayload | null> {
  const token = tokenFromRequest(req);
  return token ? verifyToken(token) : null;
}

export type SessionResult = { session: SessionPayload; error?: undefined } | { session?: undefined; error: NextResponse };

// Barra a requisição sem token válido (401) ou de outro perfil (403). Quem chama usa `error` como resposta.
export async function requireSession(req: Request, roles?: Role[]): Promise<SessionResult> {
  const session = await getSession(req);
  if (!session) {
    return { error: NextResponse.json({ error: "Sessão expirada. Entre novamente." }, { status: 401 }) };
  }
  if (roles && !roles.includes(session.role)) {
    return { error: NextResponse.json({ error: "Você não tem acesso a este recurso." }, { status: 403 }) };
  }
  return { session };
}

// Os apps antigos mandam o e-mail na URL ou no corpo. Ele continua aceito, mas só se for o da própria sessão:
// ninguém lê nem altera dados de outro usuário trocando o e-mail da requisição.
export function emailMatches(session: SessionPayload, informed: string | null | undefined): boolean {
  return !informed || informed.trim().toLowerCase() === session.email.trim().toLowerCase();
}

export function forbiddenEmail(): NextResponse {
  return NextResponse.json({ error: "Você só pode acessar os seus próprios dados." }, { status: 403 });
}
