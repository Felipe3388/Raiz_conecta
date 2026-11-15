import type { CatalogProduct, ProductSuggestion, SuggestionRecord } from "@/types/produtor";

// O que as telas do Meu Catálogo precisam. Implementado pela API (ApiCatalogService) e pelo MockCatalogService.
export interface CatalogGateway {
  // GET /api/produtos
  listProducts(): Promise<CatalogProduct[]>;
  // GET /api/produtor/meus-produtos?email=
  getMyProductIds(email: string): Promise<number[]>;
  // POST /api/produtor/meus-produtos
  saveMyProductIds(email: string, ids: number[]): Promise<void>;
  // POST /api/produtor/sugestao. Devolve o código da sugestão, para ela poder ser retirada.
  suggestProduct(email: string, suggestion: ProductSuggestion): Promise<string>;
  // Retira uma sugestão ainda pendente do próprio produtor (Desfazer).
  withdrawSuggestion(email: string, id: string): Promise<void>;
  // Histórico das sugestões do produtor autenticado, com os status persistidos no banco.
  listSuggestions(email: string): Promise<SuggestionRecord[]>;
}
