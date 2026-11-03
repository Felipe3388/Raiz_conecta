// Regras do que o administrador pode fazer com um usuário. Funções puras, testadas à parte.

export const MANAGED_TYPES = ["produtor", "mercado"] as const;
export type ManagedType = (typeof MANAGED_TYPES)[number];

export const USER_STATUSES = ["EM_ANALISE", "APROVADO", "REJEITADO", "SUSPENSO"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export function isManagedType(value: unknown): value is ManagedType {
  return typeof value === "string" && (MANAGED_TYPES as readonly string[]).includes(value);
}

export function isUserStatus(value: unknown): value is UserStatus {
  return typeof value === "string" && (USER_STATUSES as readonly string[]).includes(value);
}

// O e-mail que o microsserviço manda para cada mudança de status (EM_ANALISE não avisa ninguém).
export function emailForStatus(status: UserStatus): "aprovacao" | "rejeicao" | "suspensao" | null {
  if (status === "APROVADO") return "aprovacao";
  if (status === "REJEITADO") return "rejeicao";
  if (status === "SUSPENSO") return "suspensao";
  return null;
}

// Só estes campos o administrador pode corrigir no cadastro de alguém; o resto (documento, status, e-mail) tem rota própria.
export interface UserEdit {
  nomeFantasia?: string;
  telefone?: string;
  cidade?: string;
  estado?: string;
}

export function pickUserEdit(body: Record<string, unknown>): UserEdit {
  const edit: UserEdit = {};
  for (const field of ["nomeFantasia", "telefone", "cidade", "estado"] as const) {
    const value = body[field];
    if (typeof value === "string") edit[field] = value.trim();
  }
  // Nome vazio não vale: o usuário ficaria sem identificação.
  if (edit.nomeFantasia !== undefined && edit.nomeFantasia.length < 3) delete edit.nomeFantasia;
  if (edit.estado !== undefined) edit.estado = edit.estado.toUpperCase().slice(0, 2);
  return edit;
}
