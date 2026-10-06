// A API guarda perfil e status como texto livre; os valores conhecidos estão abaixo.
export type UserRole = "produtor" | "mercado" | "admin";
export type AccountStatus = "APROVADO" | "EM_ANALISE" | "REJEITADO" | "SUSPENSO";

export interface AuthUser {
  email: string;
  nome: string;
  tipoUser: UserRole | string;
  status: AccountStatus | string;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: AuthUser;
}

export interface TokenPayload {
  email: string;
  role: string;
  nome: string;
  status: string;
  exp: number;
}
