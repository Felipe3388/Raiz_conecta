import type {
  DocumentType,
  ProfileFields,
  ProofType,
  RegistrationProfile,
} from "@/types/registration";

// Produtor pode se cadastrar com CPF ou CNPJ; mercado, somente com CNPJ.
export function allowedDocumentTypes(profile: RegistrationProfile): DocumentType[] {
  return profile === "mercado" ? ["CNPJ"] : ["CPF", "CNPJ"];
}

// A foto enviada precisa combinar com o documento informado.
export function allowedProofTypes(documentType: DocumentType): ProofType[] {
  return documentType === "CPF" ? ["RG", "CNH"] : ["CONTRATO_SOCIAL", "CARTAO_CNPJ"];
}

export function profileDefaults(
  profile: RegistrationProfile,
): Pick<ProfileFields, "documentType" | "proofType" | "documento"> {
  const [documentType] = allowedDocumentTypes(profile);
  const [proofType] = allowedProofTypes(documentType);
  return { documentType, proofType, documento: "" };
}
