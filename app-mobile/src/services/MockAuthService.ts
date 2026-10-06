import { ApiError } from "@/lib/http/ApiError";
import type { AuthUser } from "@/types/auth";
import type { AuthGateway } from "./AuthGateway";
import { AuthError } from "./AuthError";
import { evaluateAccess } from "./accessPolicy";

interface MockAuthOptions {
  latencyMs?: number;
}

// Cenários por prefixo do e-mail, para ver cada tela de bloqueio do login.
const SCENARIOS: Record<string, Pick<AuthUser, "tipoUser" | "status">> = {
  analise: { tipoUser: "produtor", status: "EM_ANALISE" },
  rejeitado: { tipoUser: "produtor", status: "REJEITADO" },
  suspenso: { tipoUser: "produtor", status: "SUSPENSO" },
  mercado: { tipoUser: "mercado", status: "APROVADO" },
};
const DEFAULT_SCENARIO = { tipoUser: "produtor", status: "APROVADO" };
const WRONG_PASSWORD = "errada";

export class MockAuthService implements AuthGateway {
  private readonly latencyMs: number;

  constructor({ latencyMs = 500 }: MockAuthOptions = {}) {
    this.latencyMs = latencyMs;
  }

  async login(email: string, senha: string): Promise<AuthUser> {
    await this.wait();

    if (senha === WRONG_PASSWORD) {
      throw new ApiError("E-mail ou senha incorretos.", 401);
    }

    const [prefix] = email.split("@");
    const scenario = SCENARIOS[prefix.toLowerCase()] ?? DEFAULT_SCENARIO;
    const user: AuthUser = { email, nome: prefix, ...scenario };

    const denial = evaluateAccess(user);
    if (denial) throw new AuthError(denial.message, denial.code);

    return user;
  }

  // Sem sessão ao abrir: o login aparece sempre primeiro.
  async restoreSession(): Promise<AuthUser | null> {
    return null;
  }

  async logout(): Promise<void> {}

  private wait(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, this.latencyMs));
  }
}
