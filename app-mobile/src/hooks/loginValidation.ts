import { isValidEmail } from "@/lib/validation/email";

export interface LoginFields {
  email: string;
  senha: string;
}

// Retorna a mensagem do primeiro problema encontrado, ou null se estiver válido.
export function validateLogin({ email, senha }: LoginFields): string | null {
  if (!email.trim()) return "Informe seu e-mail.";
  if (!isValidEmail(email)) return "Informe um e-mail válido.";
  if (!senha) return "Informe sua senha.";
  return null;
}
