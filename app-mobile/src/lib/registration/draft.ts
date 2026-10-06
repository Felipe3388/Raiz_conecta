import type { AccountFields, ProfileFields } from "@/types/registration";

export function emptyAccount(): AccountFields {
  return {
    profile: "produtor",
    nome: "",
    email: "",
    telefone: "",
    senha: "",
    confirmarSenha: "",
    acceptedTerms: false,
  };
}

export function emptyProfile(): ProfileFields {
  return {
    documentType: "CPF",
    documento: "",
    proofType: "RG",
    cep: "",
    rua: "",
    numero: "",
    bairro: "",
    cidade: "",
    estado: "",
    attachment: null,
  };
}
