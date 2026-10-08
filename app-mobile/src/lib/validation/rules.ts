import { digitsOnly } from "@/lib/format/masks";

// Regra: devolve a mensagem do problema, ou null se estiver tudo certo.
export type Rule = () => string | null;

const MIN_PHONE_DIGITS = 10;
const CEP_DIGITS = 8;
const UF_LENGTH = 2;

// Retorna a mensagem do primeiro problema encontrado, ou null se estiver tudo certo.
export function firstError(rules: Rule[]): string | null {
  for (const rule of rules) {
    const error = rule();
    if (error) return error;
  }
  return null;
}

export const required =
  (value: string, message: string): Rule =>
  () =>
    value.trim() ? null : message;

export const validPhone =
  (value: string): Rule =>
  () =>
    digitsOnly(value).length >= MIN_PHONE_DIGITS ? null : "Informe um telefone válido com DDD.";

export const validCep =
  (value: string): Rule =>
  () =>
    digitsOnly(value).length === CEP_DIGITS ? null : "Informe um CEP válido.";

export const validUf =
  (value: string): Rule =>
  () =>
    value.trim().length === UF_LENGTH ? null : "Informe a UF com 2 letras.";

export const PASSWORDS_DIFFER_MESSAGE = "As senhas não coincidem. Verifique e tente novamente.";
