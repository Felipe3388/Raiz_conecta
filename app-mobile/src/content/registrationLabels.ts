import type { DocumentType, ProofType } from "@/types/registration";

export const DOCUMENT_LABELS: Record<DocumentType, string> = {
  CPF: "Pessoa Física (CPF)",
  CNPJ: "Empresa (CNPJ)",
};

export const DOCUMENT_EXAMPLES: Record<DocumentType, string> = {
  CPF: "Ex.: 123.456.789-01",
  CNPJ: "Ex.: 12.345.678/0001-90",
};

export const PROOF_LABELS: Record<ProofType, string> = {
  RG: "RG (Identidade)",
  CNH: "CNH (Carteira de motorista)",
  CONTRATO_SOCIAL: "Contrato Social",
  CARTAO_CNPJ: "Cartão CNPJ",
};

// Título da área de envio da foto: "Foto do RG", "Foto da CNH"...
export const PROOF_PHOTO_TITLES: Record<ProofType, string> = {
  RG: "Foto do RG",
  CNH: "Foto da CNH",
  CONTRATO_SOCIAL: "Foto do Contrato Social",
  CARTAO_CNPJ: "Foto do Cartão CNPJ",
};
