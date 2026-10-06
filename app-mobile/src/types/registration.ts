export type RegistrationProfile = "produtor" | "mercado";
export type DocumentType = "CPF" | "CNPJ";
export type ProofType = "RG" | "CNH" | "CONTRATO_SOCIAL" | "CARTAO_CNPJ";

// Passo 1: dados da conta.
export interface AccountFields {
  profile: RegistrationProfile;
  nome: string;
  email: string;
  telefone: string;
  senha: string;
  confirmarSenha: string;
  acceptedTerms: boolean;
}

export interface Address {
  cep: string;
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
}

export interface Attachment {
  uri: string;
  name: string;
  mimeType: string;
}

// Passo 2: documento, endereço e comprovante.
export interface ProfileFields extends Address {
  documentType: DocumentType;
  documento: string;
  proofType: ProofType;
  attachment: Attachment | null;
}

// Dados completos, como o formulário preenchido (com máscaras).
export interface RegistrationData {
  account: AccountFields;
  profile: ProfileFields;
}
