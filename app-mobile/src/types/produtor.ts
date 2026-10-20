import type { Attachment } from "./registration";

// Produto do catálogo oficial (GET /api/produtos).
export interface CatalogProduct {
  cdProduto: number;
  nome: string;
  tipo: string;
  imagemUrl: string | null;
  unidadePadrao: string;
}

// "Sugerir Novo Produto": campos como a pessoa digitou.
export interface ProductSuggestion {
  nomeProduto: string;
  descricao: string;
  precoSugerido: string;
  attachment: Attachment | null;
}

// Situação de um produto sugerido. O site ainda não guarda isso (ver ARQUITETURA.md).
export type SuggestionStatus = "EM_ANALISE" | "APROVADA" | "RECUSADA";

export interface SuggestionRecord {
  id: string;
  nomeProduto: string;
  descricao: string;
  precoSugerido: number | null;
  status: SuggestionStatus;
  criadoEm: string;
  // Por que foi recusada, quando a equipe explicou.
  motivo?: string;
}

export interface ProducerProfile {
  email: string;
  nomeFantasia: string;
  telefone: string;
  tipoDoc: "CPF" | "CNPJ";
  documento: string;
  cep: string;
  rua: string;
  numero: string;
  cidade: string;
  estado: string;
}

// Campos que a pessoa pode alterar no perfil (e-mail e documento ficam travados).
export type EditableProfile = Pick<
  ProducerProfile,
  "nomeFantasia" | "telefone" | "cep" | "rua" | "numero" | "cidade" | "estado"
>;
