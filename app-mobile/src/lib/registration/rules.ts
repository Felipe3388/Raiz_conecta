import type { DocumentType, ProofType } from "@/types/registration";

// O app é do produtor, que pode se cadastrar com CPF ou CNPJ.
export const DOCUMENT_TYPES: DocumentType[] = ["CPF", "CNPJ"];

// A foto enviada precisa combinar com o documento informado.
export function allowedProofTypes(documentType: DocumentType): ProofType[] {
  return documentType === "CPF" ? ["RG", "CNH"] : ["CONTRATO_SOCIAL", "CARTAO_CNPJ"];
}
