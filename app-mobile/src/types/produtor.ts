import type { Attachment } from "./registration";

// Produto do catálogo oficial (GET /api/produtos).
export interface CatalogProduct {
  cdProduto: number;
  nome: string;
  tipo: string;
  imagemUrl: string | null;
  unidadePadrao: string;
}

export interface Offer {
  quantidade: number;
  emailProdutor: string;
  // Preço por unidade combinado nesta oferta. Ofertas antigas não têm.
  preco?: number;
}

export type DemandStatus = "ABERTA" | "CONCLUIDA" | "CANCELADA";

// Pedido de um mercado (GET /api/mercado/demandas). O app não mostra quem pediu.
export interface Demand {
  id: string;
  produto: string;
  quantidade: number;
  unidade: string;
  precoMedio: number | null;
  status: DemandStatus;
  ofertas: Offer[];
  criadoEm: string;
}

export interface OfferRequest {
  demandaId: string;
  quantidade: number;
  emailProdutor: string;
  preco?: number;
}

// Cancelar a oferta que o próprio produtor acabou de fazer (usado no "Desfazer").
export interface CancelOfferRequest {
  demandaId: string;
  emailProdutor: string;
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
