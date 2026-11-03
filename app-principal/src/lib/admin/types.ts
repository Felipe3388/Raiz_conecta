// O que as rotas de /api/admin devolvem, como as telas do painel as enxergam.

export type UserKind = "produtor" | "mercado" | "admin";
export type UserStatusName = "EM_ANALISE" | "APROVADO" | "REJEITADO" | "SUSPENSO";

export interface AdminUser {
  email: string;
  tipo: UserKind;
  status: UserStatusName;
  nomeFantasia: string | null;
  razaoSocial?: string | null;
  documento?: string | null;
  tipoDoc?: string | null;
  telefone?: string | null;
  cidade?: string | null;
  estado?: string | null;
  urlDocumento?: string | null;
  criadoEm?: string | null;
}

export interface AdminProduct {
  cdProduto: number;
  nome: string | null;
  tipo: string | null;
  preco: number | null;
  unidadePadrao: string | null;
  descricao: string | null;
  imagemUrl: string | null;
  status: string | null;
}

export interface AdminSuggestion {
  id: number;
  emailProdutor: string;
  nomeProduto: string;
  descricao: string | null;
  precoSugerido: number | null;
  imagemUrl: string | null;
  criadoEm: string;
}

export interface AdminScale {
  deviceId: string;
  nome: string;
  codigo: string;
  emailProdutor: string | null;
  apelido: string | null;
  conectada: boolean;
  online: boolean;
  firmware: string | null;
  ultimoContato: string | null;
  ultimoKg: number | null;
  vinculadaEm: string | null;
  criadoEm: string;
}

export const userName = (user: Pick<AdminUser, "nomeFantasia" | "razaoSocial" | "email">) =>
  user.nomeFantasia || user.razaoSocial || user.email;

// Um usuário "pendente" espera aprovação; os demais entram na gestão.
export const isPending = (user: AdminUser) => user.status === "EM_ANALISE";

export interface UserFilters {
  query: string;
  kind: "todos" | UserKind;
  status: "todos" | UserStatusName;
}

export function filterUsers(users: AdminUser[], { query, kind, status }: UserFilters): AdminUser[] {
  const needle = query.trim().toLowerCase();
  return users.filter((user) => {
    if (isPending(user)) return false;
    const matchesQuery = !needle || userName(user).toLowerCase().includes(needle) || user.email.toLowerCase().includes(needle);
    return matchesQuery && (kind === "todos" || user.tipo === kind) && (status === "todos" || user.status === status);
  });
}
