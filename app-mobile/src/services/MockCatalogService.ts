import type { CatalogProduct, ProductSuggestion, SuggestionRecord } from "@/types/produtor";
import type { CatalogGateway } from "./CatalogGateway";
import { DEFAULT_MOCK_LATENCY_MS, wait } from "./mockLatency";

interface MockCatalogOptions {
  products: CatalogProduct[];
  // Escolhas de quem ainda não salvou nada.
  defaultMyProductIds: number[];
  // Sugestões que cada produtor já tem ao entrar (opcional).
  seedSuggestions?: (email: string) => SuggestionRecord[];
  latencyMs?: number;
}

interface StoredSuggestion extends ProductSuggestion {
  id: string;
  emailProdutor: string;
}

export class MockCatalogService implements CatalogGateway {
  private readonly products: CatalogProduct[];
  private readonly defaultIds: number[];
  private readonly latencyMs: number;
  private readonly savedIds = new Map<string, number[]>();
  private readonly suggestions: StoredSuggestion[] = [];
  private readonly records = new Map<string, SuggestionRecord[]>();
  private readonly seedSuggestions: (email: string) => SuggestionRecord[];
  private nextRecordId = 1;

  constructor({
    products,
    defaultMyProductIds,
    seedSuggestions = () => [],
    latencyMs = DEFAULT_MOCK_LATENCY_MS,
  }: MockCatalogOptions) {
    this.products = products;
    this.defaultIds = defaultMyProductIds;
    this.seedSuggestions = seedSuggestions;
    this.latencyMs = latencyMs;
  }

  private recordsOf(email: string): SuggestionRecord[] {
    let list = this.records.get(email);
    if (!list) {
      list = this.seedSuggestions(email);
      this.records.set(email, list);
    }
    return list;
  }

  async listProducts(): Promise<CatalogProduct[]> {
    await wait(this.latencyMs);
    return this.products.map((product) => ({ ...product }));
  }

  async getMyProductIds(email: string): Promise<number[]> {
    await wait(this.latencyMs);
    return [...(this.savedIds.get(email) ?? this.defaultIds)];
  }

  async saveMyProductIds(email: string, ids: number[]): Promise<void> {
    await wait(this.latencyMs);
    this.savedIds.set(email, [...ids]);
  }

  async suggestProduct(email: string, suggestion: ProductSuggestion): Promise<string> {
    await wait(this.latencyMs);
    const id = `s-novo-${this.nextRecordId++}`;
    this.suggestions.push({ id, emailProdutor: email, ...suggestion });

    const price = suggestion.precoSugerido.trim();
    this.recordsOf(email).push({
      id,
      nomeProduto: suggestion.nomeProduto.trim(),
      descricao: suggestion.descricao.trim(),
      precoSugerido: price === "" ? null : Number(price),
      status: "EM_ANALISE",
      criadoEm: new Date().toISOString(),
    });
    return id;
  }

  async withdrawSuggestion(email: string, id: string): Promise<void> {
    await wait(this.latencyMs);
    const records = this.recordsOf(email);
    const index = records.findIndex((record) => record.id === id);
    if (index < 0) throw new Error("Sugestão não encontrada.");
    records.splice(index, 1);
    const stored = this.suggestions.findIndex((item) => item.id === id);
    if (stored >= 0) this.suggestions.splice(stored, 1);
  }

  async listSuggestions(email: string): Promise<SuggestionRecord[]> {
    await wait(this.latencyMs);
    return this.recordsOf(email).map((record) => ({ ...record }));
  }

  // Só para conferir no teste o que foi enviado.
  getSuggestions(): StoredSuggestion[] {
    return [...this.suggestions];
  }
}
