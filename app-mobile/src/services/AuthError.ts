export type AuthErrorCode = "EM_ANALISE" | "BLOQUEADO" | "PERFIL_NAO_PERMITIDO";

export class AuthError extends Error {
  constructor(
    message: string,
    readonly code: AuthErrorCode,
  ) {
    super(message);
    this.name = "AuthError";
  }
}
