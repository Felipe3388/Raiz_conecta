import { maskCep } from "@/lib/format/mask";
import { isValidPassword, maskPhone, PASSWORD_MESSAGE, PASSWORDS_DIFFER_MESSAGE } from "@/lib/validation/auth";
import { parsePerfilChanges } from "@/lib/validation/perfil";

// O que GET /api/perfil/meus-dados devolve (produtor ou mercado).
export interface PerfilDto {
  email: string;
  tipoDoc?: string | null;
  documento?: string | null;
  nomeFantasia?: string | null;
  telefone?: string | null;
  cep?: string | null;
  rua?: string | null;
  numero?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
}

export const PROFILE_FIELDS = ["nomeFantasia", "telefone", "cep", "rua", "numero", "bairro", "cidade", "estado"] as const;
export type ProfileForm = Record<(typeof PROFILE_FIELDS)[number], string>;

export interface PasswordChange {
  atual: string;
  nova: string;
  confirmar: string;
}

export const NO_PASSWORD_CHANGE: PasswordChange = { atual: "", nova: "", confirmar: "" };

// Os campos editáveis, já com as máscaras (o banco guarda telefone e CEP de vários jeitos).
export function toProfileForm(dto: PerfilDto): ProfileForm {
  return {
    nomeFantasia: dto.nomeFantasia ?? "",
    telefone: dto.telefone ? maskPhone(dto.telefone) : "",
    cep: dto.cep ? maskCep(dto.cep) : "",
    rua: dto.rua ?? "",
    numero: dto.numero ?? "",
    bairro: dto.bairro ?? "",
    cidade: dto.cidade ?? "",
    estado: dto.estado ?? "",
  };
}

export const isChangingPassword = (passwords: PasswordChange) => Boolean(passwords.atual || passwords.nova || passwords.confirmar);

export function isProfileDirty(form: ProfileForm, saved: ProfileForm, passwords: PasswordChange): boolean {
  return isChangingPassword(passwords) || PROFILE_FIELDS.some((field) => form[field] !== saved[field]);
}

// Confere tudo antes de abrir a confirmação. `null` = pode salvar; senão, a primeira mensagem para mostrar.
export function reviewProfile(form: ProfileForm, passwords: PasswordChange): string | null {
  const check = parsePerfilChanges({ ...form });
  if (!check.ok) return check.error;
  if (!isChangingPassword(passwords)) return null;
  if (!passwords.atual) return "Informe a senha atual para trocar a senha.";
  if (!isValidPassword(passwords.nova)) return PASSWORD_MESSAGE;
  if (passwords.nova !== passwords.confirmar) return PASSWORDS_DIFFER_MESSAGE;
  if (passwords.nova === passwords.atual) return "A nova senha precisa ser diferente da atual.";
  return null;
}

// O corpo de PUT /api/perfil/meus-dados: a senha só vai quando a pessoa pediu para trocar.
export function profileRequest(form: ProfileForm, passwords: PasswordChange) {
  return { ...form, ...(isChangingPassword(passwords) ? { senhaAtual: passwords.atual, novaSenha: passwords.nova } : {}) };
}
