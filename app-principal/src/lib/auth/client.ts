// O que o navegador sabe da sessão. O token fica só no cookie httpOnly (o JavaScript da página não o lê); a identidade
// de quem está logado vem de GET /api/auth/me (ver hooks/useSession).

export type SessionRole = "admin" | "produtor" | "mercado";

export function isSessionRole(value: unknown): value is SessionRole {
  return value === "admin" || value === "produtor" || value === "mercado";
}

// Para onde cada perfil vai logo depois de entrar.
export function homeFor(role: string): string {
  const homes: Record<string, string> = { admin: "/admin", produtor: "/produtor", mercado: "/catalogo" };
  return homes[role] ?? "/";
}

// Versões antigas do site guardavam o token e os dados no localStorage. Quem já tinha entrado fica com esses restos;
// a barra do topo os apaga uma vez.
const LEGACY_KEYS = ["token", "userEmail", "userName", "userRole"] as const;

export function clearLegacySession(storage: Pick<Storage, "removeItem">): void {
  LEGACY_KEYS.forEach((key) => storage.removeItem(key));
}
