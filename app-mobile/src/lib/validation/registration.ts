import { digitsOnly } from "@/lib/format/masks";
import { isValidPassword } from "@/lib/auth/password";
import { allowedDocumentTypes, allowedProofTypes } from "@/lib/registration/rules";
import type {
  AccountFields,
  DocumentType,
  ProfileFields,
  RegistrationProfile,
} from "@/types/registration";
import { isValidEmail } from "./email";

const DOCUMENT_DIGITS: Record<DocumentType, number> = { CPF: 11, CNPJ: 14 };
const MIN_PHONE_DIGITS = 10;
const CEP_DIGITS = 8;

type Rule = () => string | null;

// Retorna a mensagem do primeiro problema encontrado, ou null se estiver tudo certo.
function firstError(rules: Rule[]): string | null {
  for (const rule of rules) {
    const error = rule();
    if (error) return error;
  }
  return null;
}

const required = (value: string, message: string): Rule => () => (value.trim() ? null : message);

export function validateAccount(fields: AccountFields): string | null {
  return firstError([
    required(fields.nome, "Informe o nome fantasia ou razão social."),
    () => (isValidEmail(fields.email) ? null : "E-mail inválido. Use o formato nome@dominio.com."),
    () =>
      digitsOnly(fields.telefone).length >= MIN_PHONE_DIGITS
        ? null
        : "Informe um telefone válido com DDD.",
    () =>
      isValidPassword(fields.senha)
        ? null
        : "A senha deve ter mínimo 8 caracteres, letra maiúscula, minúscula, número e caractere especial (!@#$%...).",
    () =>
      fields.senha === fields.confirmarSenha
        ? null
        : "As senhas não coincidem. Verifique e tente novamente.",
    () =>
      fields.acceptedTerms ? null : "Aceite os Termos de Uso e a Política de Privacidade.",
  ]);
}

export function validateProfile(
  fields: ProfileFields,
  accountProfile: RegistrationProfile,
): string | null {
  return firstError([
    () =>
      allowedDocumentTypes(accountProfile).includes(fields.documentType)
        ? null
        : "Mercado / Supermercado só pode se cadastrar com CNPJ.",
    () =>
      digitsOnly(fields.documento).length === DOCUMENT_DIGITS[fields.documentType]
        ? null
        : `${fields.documentType} deve ter ${DOCUMENT_DIGITS[fields.documentType]} dígitos.`,
    () => (digitsOnly(fields.cep).length === CEP_DIGITS ? null : "Informe um CEP válido."),
    () =>
      allowedProofTypes(fields.documentType).includes(fields.proofType)
        ? null
        : "Escolha uma foto que combine com o documento informado.",
    required(fields.rua, "Informe a rua ou estrada."),
    required(fields.numero, "Informe o número (ou S/N)."),
    required(fields.bairro, "Informe o bairro."),
    required(fields.cidade, "Informe a cidade."),
    () => (fields.estado.trim().length === 2 ? null : "Informe a UF com 2 letras."),
    () =>
      fields.attachment ? null : "Anexe a foto do seu documento para validação.",
  ]);
}
