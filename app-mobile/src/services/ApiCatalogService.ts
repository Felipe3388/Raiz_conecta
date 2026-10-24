import type { ApiClient } from "@/lib/http/ApiClient";
import { appendAttachment } from "@/lib/http/formData";
import type { CatalogProduct, ProductSuggestion, SuggestionRecord } from "@/types/produtor";
import type { CatalogGateway } from "./CatalogGateway";

// O que GET /api/produtos devolve de cada produto (só o que o app usa).
interface ProdutoDto {
  cdProduto: number;
  nome: string | null;
  tipo: string | null;
  imagemUrl: string | null;
  status?: string | null;
}

// Tudo é vendido por kg (1 unidade = 1 kg), qualquer que seja a unidade padrão cadastrada no site.
export const SELL_UNIT = "kg";

export function toCatalogProduct(dto: ProdutoDto): CatalogProduct {
  return {
    cdProduto: dto.cdProduto,
    nome: dto.nome ?? "Produto",
    tipo: dto.tipo ?? "",
    imagemUrl: dto.imagemUrl || null,
    unidadePadrao: SELL_UNIT,
  };
}

// Catálogo ligado à API do app-principal. O site ainda não guarda a situação das sugestões nem deixa retirá-las:
// por isso a lista "Minhas sugestões" e o "Desfazer" ficam num serviço local (`local`), que recebe cada sugestão
// depois que a API aceita.
export class ApiCatalogService implements CatalogGateway {
  constructor(
    private readonly api: Pick<ApiClient, "get" | "post" | "postForm">,
    private readonly local: Pick<CatalogGateway, "suggestProduct" | "withdrawSuggestion" | "listSuggestions">,
    private readonly appendFile: typeof appendAttachment = appendAttachment,
  ) {}

  async listProducts(): Promise<CatalogProduct[]> {
    const products = await this.api.get<ProdutoDto[]>("/api/produtos");
    return products.filter((product) => !product.status || product.status === "ATIVO").map(toCatalogProduct);
  }

  getMyProductIds(email: string): Promise<number[]> {
    return this.api.get<number[]>(`/api/produtor/meus-produtos?email=${encodeURIComponent(email)}`);
  }

  // Só os códigos: o site mantém o preço que cada produto já tinha.
  async saveMyProductIds(email: string, ids: number[]): Promise<void> {
    await this.api.post("/api/produtor/meus-produtos", {
      email,
      produtos: ids.map((cdProduto) => ({ cdProduto })),
    });
  }

  async suggestProduct(email: string, suggestion: ProductSuggestion): Promise<string> {
    const form = new FormData();
    form.append("emailProdutor", email);
    form.append("nomeProduto", suggestion.nomeProduto.trim());
    form.append("descricao", suggestion.descricao.trim());
    form.append("precoSugerido", suggestion.precoSugerido.trim());
    if (suggestion.attachment) await this.appendFile(form, "file", suggestion.attachment);

    await this.api.postForm("/api/produtor/sugestao", form);
    return this.local.suggestProduct(email, suggestion);
  }

  withdrawSuggestion(email: string, id: string): Promise<void> {
    return this.local.withdrawSuggestion(email, id);
  }

  listSuggestions(email: string): Promise<SuggestionRecord[]> {
    return this.local.listSuggestions(email);
  }
}
