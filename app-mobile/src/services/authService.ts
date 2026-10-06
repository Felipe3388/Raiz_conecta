import type { ApiClient } from "@/lib/http/ApiClient";
import { decodeToken } from "@/lib/auth/jwt";
import type { TokenStorage } from "@/lib/storage";
import type { AuthUser, LoginResponse } from "@/types/auth";
import type { AuthGateway } from "./AuthGateway";
import { AuthError } from "./AuthError";
import { evaluateAccess } from "./accessPolicy";

export class AuthService implements AuthGateway {
  constructor(
    private readonly api: Pick<ApiClient, "post">,
    private readonly tokens: TokenStorage,
    private readonly now: () => number = Date.now,
  ) {}

  async login(email: string, senha: string): Promise<AuthUser> {
    const { token, user } = await this.api.post<LoginResponse>("/api/auth/login", {
      email,
      senha,
    });

    const denial = evaluateAccess(user);
    if (denial) throw new AuthError(denial.message, denial.code);

    await this.tokens.save(token);
    return user;
  }

  async restoreSession(): Promise<AuthUser | null> {
    const token = await this.readToken();
    if (!token) return null;

    const payload = decodeToken(token);
    const user = payload && {
      email: payload.email,
      nome: payload.nome,
      tipoUser: payload.role,
      status: payload.status,
    };
    const isExpired = !payload || payload.exp * 1000 <= this.now();

    if (!user || isExpired || evaluateAccess(user)) {
      await this.tokens.clear();
      return null;
    }
    return user;
  }

  logout(): Promise<void> {
    return this.tokens.clear();
  }

  // Se o armazenamento falhar, o usuário apenas cai na tela de login.
  private async readToken(): Promise<string | null> {
    try {
      return await this.tokens.get();
    } catch {
      return null;
    }
  }
}
