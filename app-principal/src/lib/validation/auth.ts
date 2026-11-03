// Regras de e-mail, senha e telefone do login e do cadastro. São as mesmas do app mobile (lib/validation, lib/auth),
// para a pessoa ver a mesma mensagem nos dois lugares. Funções puras: não dependem de tela nem de rede.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const SPECIAL_CHARACTERS = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/;

export const EMAIL_MESSAGE = "E-mail inválido. Use o formato nome@dominio.com.";
export const PASSWORD_MESSAGE =
  "A senha deve ter mínimo 8 caracteres, letra maiúscula, minúscula, número e caractere especial (!@#$%...).";
export const PASSWORDS_DIFFER_MESSAGE = "As senhas não coincidem. Verifique e tente novamente.";

export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email.trim());
}

export interface PasswordRequirement {
  label: string;
  met: boolean;
}

// Um requisito por linha, para a pessoa ver o que falta.
export function passwordRequirements(password: string): PasswordRequirement[] {
  return [
    { label: "Pelo menos 8 caracteres", met: password.length >= 8 },
    { label: "Uma letra maiúscula (A-Z)", met: /[A-Z]/.test(password) },
    { label: "Uma letra minúscula (a-z)", met: /[a-z]/.test(password) },
    { label: "Um número (0-9)", met: /\d/.test(password) },
    { label: "Um símbolo (! @ # $ %)", met: SPECIAL_CHARACTERS.test(password) },
  ];
}

export function isValidPassword(password: string): boolean {
  return passwordRequirements(password).every((requirement) => requirement.met);
}

const STRENGTH_LABELS = ["Muito fraca", "Fraca", "Razoável", "Forte", "Muito forte"] as const;

export interface PasswordStrength {
  // 0 a 5: quantas barras ficam preenchidas.
  score: number;
  label: (typeof STRENGTH_LABELS)[number];
}

export function passwordStrength(password: string): PasswordStrength {
  const score = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /\d/.test(password),
    SPECIAL_CHARACTERS.test(password),
    password.length >= 12,
  ].filter(Boolean).length;
  return { score, label: STRENGTH_LABELS[Math.max(0, score - 1)] };
}

// Máscara do telefone enquanto digita: (14) 99999-9999.
export function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export interface LoginFields {
  email: string;
  senha: string;
}

// `null` = pode enviar.
export function validateLogin({ email, senha }: LoginFields): string | null {
  if (!email.trim() || !senha) return "Preencha o e-mail e a senha.";
  if (!isValidEmail(email)) return EMAIL_MESSAGE;
  return null;
}

export interface SignupFields {
  nome: string;
  email: string;
  telefone: string;
  senha: string;
  confirmarSenha: string;
}

export function validateSignup(fields: SignupFields): string | null {
  if (fields.nome.trim().length < 3) return "Informe o nome fantasia ou razão social (mínimo 3 letras).";
  if (!isValidEmail(fields.email)) return EMAIL_MESSAGE;
  if (fields.telefone && fields.telefone.replace(/\D/g, "").length < 10) return "Telefone inválido. Use DDD + número.";
  if (!isValidPassword(fields.senha)) return PASSWORD_MESSAGE;
  if (fields.senha !== fields.confirmarSenha) return PASSWORDS_DIFFER_MESSAGE;
  return null;
}
