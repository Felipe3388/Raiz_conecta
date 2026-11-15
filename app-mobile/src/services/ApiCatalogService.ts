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

// Contrato da API de sugestões, já filtrada pela sessão do produtor.
interface SuggestionDto {
  id: number;
  nomeProduto: string;
  descricao: string | null;
  precoSugerido: number | null;
  status: "EM_ANALISE" | "APROVADA" | "RECUSADA";
  criadoEm: string;
  motivo: string | null;
  decididoEm: string | null;
}

export function toSuggestionRecord(dto: SuggestionDto): SuggestionRecord {
  if (!["EM_ANALISE", "APROVADA", "RECUSADA"].includes(dto.status)) {
    throw new Error("Status de sugestão desconhecido.");
  }
  return {
    id: String(dto.id),
    nomeProduto: dto.nomeProduto,
    descricao: dto.descricao ?? "",
    precoSugerido: dto.precoSugerido,
    status: dto.status,
    criadoEm: dto.criadoEm,
    motivo: dto.motivo ?? undefined,
    decididoEm: dto.decididoEm ?? null,
  };
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

// Catálogo e sugestões conectados diretamente à API do app-principal.
// O histórico e a situação de cada sugestão são mantidos no banco, não no dispositivo.
export class ApiCatalogService implements CatalogGateway {
  constructor(
    private readonly api: Pick<ApiClient, "get" | "post" | "postForm" | "delete">,
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

    const created = await this.api.postForm<{ id: number }>("/api/produtor/sugestao", form);
    if (!Number.isInteger(created?.id) || created.id <= 0) {
      throw new Error("O servidor não retornou o identificador da sugestão.");
    }
    return String(created.id);
  }

  async withdrawSuggestion(_email: string, id: string): Promise<void> {
    if (!/^[1-9]\d*$/.test(id)) throw new Error("Identificador de sugestão inválido.");
    await this.api.delete(`/api/produtor/sugestao?id=${encodeURIComponent(id)}`);
  }

  async listSuggestions(_email: string): Promise<SuggestionRecord[]> {
    const suggestions = await this.api.get<SuggestionDto[]>("/api/produtor/sugestao");
    if (!Array.isArray(suggestions)) {
      throw new Error("A API de sugestões retornou uma resposta inesperada.");
    }
    return suggestions.map(toSuggestionRecord);
  }
}
