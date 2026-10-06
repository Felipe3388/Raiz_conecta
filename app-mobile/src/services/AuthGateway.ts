import type { AuthUser } from "@/types/auth";

// O que a sessão precisa de um serviço de autenticação.
// Implementado pelo AuthService (API real) e pelo MockAuthService (simulado).
export interface AuthGateway {
  login(email: string, senha: string): Promise<AuthUser>;
  restoreSession(): Promise<AuthUser | null>;
  logout(): Promise<void>;
}
