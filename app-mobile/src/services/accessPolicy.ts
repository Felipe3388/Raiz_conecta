import type { AuthUser } from "@/types/auth";
import type { AuthErrorCode } from "./AuthError";

export interface AccessDenial {
  code: AuthErrorCode;
  message: string;
}

const ALLOWED_ROLE = "produtor";

// Uma regra por status de conta: novos status entram aqui, sem cadeia de ifs.
const STATUS_DENIALS: Record<string, AccessDenial> = {
  EM_ANALISE: {
    code: "EM_ANALISE",
    message: "Seu cadastro está em análise. Você poderá entrar assim que for aprovado.",
  },
  REJEITADO: {
    code: "BLOQUEADO",
    message: "Seu cadastro foi rejeitado. Entre em contato com o suporte.",
  },
  SUSPENSO: {
    code: "BLOQUEADO",
    message: "Sua conta está suspensa. Entre em contato com o suporte.",
  },
};

const ROLE_DENIAL: AccessDenial = {
  code: "PERFIL_NAO_PERMITIDO",
  message: "Este app é exclusivo para produtores. Acesse o site para outros perfis.",
};

export function evaluateAccess(user: AuthUser): AccessDenial | null {
  if (user.tipoUser !== ALLOWED_ROLE) return ROLE_DENIAL;
  return STATUS_DENIALS[user.status] ?? null;
}
