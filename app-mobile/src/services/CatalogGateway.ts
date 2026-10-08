import type { CatalogProduct, ProductSuggestion, SuggestionRecord } from "@/types/produtor";

// O que as telas do Meu Catálogo precisam. Implementado pela API real (a fazer) e pelo MockCatalogService.
export interface CatalogGateway {
  // GET /api/produtos
  listProducts(): Promise<CatalogProduct[]>;
  // GET /api/produtor/meus-produtos?email=
  getMyProductIds(email: string): Promise<number[]>;
  // POST /api/produtor/meus-produtos
  saveMyProductIds(email: string, ids: number[]): Promise<void>;
  // POST /api/produtor/sugestao
  suggestProduct(email: string, suggestion: ProductSuggestion): Promise<void>;
  // O site ainda não tem este endpoint: GET /api/produtor/sugestao devolve as sugestões de todos
  // e não guarda situação nem motivo de recusa (ver ARQUITETURA.md).
  listSuggestions(email: string): Promise<SuggestionRecord[]>;
}
