import { EMAIL_MESSAGE, PASSWORD_MESSAGE, isValidEmail, isValidPassword } from "./auth";

// Dados do cadastro (passo 1 + passo 2). O site, o app e a API usam estas mesmas regras.
export const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA",
  "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const;

export const ACCOUNT_TYPES = ["produtor", "mercado"] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export const digits = (value: string): string => value.replace(/\D/g, "");

export interface CadastroFields {
  tipoUsuario: string;
  nome: string;
  email: string;
  senha: string;
  telefone: string;
  tipoDoc: string;
  documento: string;
  cep: string;
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
}

// CPF tem 11 números e CNPJ 14. Só o tamanho é conferido (o dígito verificador fica para quando a análise do
// documento por foto não for manual).
export function validateDocumento(tipoDoc: string, documento: string): string | null {
  const size = digits(documento).length;
  if (tipoDoc === "CPF") return size === 11 ? null : "CPF inválido. Use os 11 números.";
  if (tipoDoc === "CNPJ") return size === 14 ? null : "CNPJ inválido. Use os 14 números.";
  return "Escolha CPF ou CNPJ.";
}

// `null` = tudo certo. A primeira mensagem de erro, em português, para mostrar à pessoa.
export function validateCadastro(fields: CadastroFields): string | null {
  if (!(ACCOUNT_TYPES as readonly string[]).includes(fields.tipoUsuario)) {
    return "Tipo de perfil inválido. Selecione Produtor Rural ou Mercado.";
  }
  if (fields.nome.trim().length < 3) return "Informe o nome fantasia ou razão social (mínimo 3 letras).";
  if (!isValidEmail(fields.email)) return EMAIL_MESSAGE;
  if (!isValidPassword(fields.senha)) return PASSWORD_MESSAGE;
  if (fields.telefone && digits(fields.telefone).length < 10) return "Telefone inválido. Use DDD + número.";
  const documento = validateDocumento(fields.tipoDoc, fields.documento);
  if (documento) return documento;
  if (digits(fields.cep).length !== 8) return "CEP inválido. Use os 8 números.";
  if (!fields.rua.trim() || !fields.numero.trim() || !fields.cidade.trim()) return "Preencha rua, número e cidade.";
  if (!(UFS as readonly string[]).includes(fields.estado.trim().toUpperCase())) return "Estado inválido. Use a sigla, como SP.";
  return null;
}
