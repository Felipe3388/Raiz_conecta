import { digitsOnly } from "@/lib/format/masks";
import { isValidPassword } from "@/lib/auth/password";
import { allowedProofTypes } from "@/lib/registration/rules";
import type { AccountFields, DocumentType, ProfileFields } from "@/types/registration";
import { isValidEmail } from "./email";
import {
  PASSWORDS_DIFFER_MESSAGE,
  firstError,
  required,
  validCep,
  validPhone,
  validUf,
} from "./rules";

const DOCUMENT_DIGITS: Record<DocumentType, number> = { CPF: 11, CNPJ: 14 };

export function validateAccount(fields: AccountFields): string | null {
  return firstError([
    required(fields.nome, "Informe o nome fantasia ou razão social."),
    () => (isValidEmail(fields.email) ? null : "E-mail inválido. Use o formato nome@dominio.com."),
    validPhone(fields.telefone),
    () =>
      isValidPassword(fields.senha)
        ? null
        : "A senha deve ter mínimo 8 caracteres, letra maiúscula, minúscula, número e caractere especial (!@#$%...).",
    () => (fields.senha === fields.confirmarSenha ? null : PASSWORDS_DIFFER_MESSAGE),
    () =>
      fields.acceptedTerms ? null : "Aceite os Termos de Uso e a Política de Privacidade.",
  ]);
}

export function validateProfile(fields: ProfileFields): string | null {
  return firstError([
    () =>
      digitsOnly(fields.documento).length === DOCUMENT_DIGITS[fields.documentType]
        ? null
        : `${fields.documentType} deve ter ${DOCUMENT_DIGITS[fields.documentType]} dígitos.`,
    validCep(fields.cep),
    () =>
      allowedProofTypes(fields.documentType).includes(fields.proofType)
        ? null
        : "Escolha uma foto que combine com o documento informado.",
    required(fields.rua, "Informe a rua ou estrada."),
    required(fields.numero, "Informe o número (ou S/N)."),
    required(fields.bairro, "Informe o bairro."),
    required(fields.cidade, "Informe a cidade."),
    validUf(fields.estado),
    () =>
      fields.attachment ? null : "Anexe a foto do seu documento para validação.",
  ]);
}
