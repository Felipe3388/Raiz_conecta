import { ApiCatalogService } from "./ApiCatalogService";

function apiMock() {
  return { get: jest.fn(), post: jest.fn(), postForm: jest.fn(), delete: jest.fn() };
}

describe("ApiCatalogService", () => {
  it("lista os produtos ativos e sempre por kg", async () => {
    const api = apiMock();
    api.get.mockResolvedValue([
      { cdProduto: 1, nome: "Tomate", tipo: "Legume", imagemUrl: "", unidadePadrao: "Caixas", status: "ATIVO" },
      { cdProduto: 2, nome: "Velho", tipo: "Fruta", imagemUrl: null, status: "INATIVO" },
      { cdProduto: 3, nome: null, tipo: null, imagemUrl: "x.png" },
    ]);
    const products = await new ApiCatalogService(api).listProducts();
    expect(api.get).toHaveBeenCalledWith("/api/produtos");
    expect(products).toEqual([
      { cdProduto: 1, nome: "Tomate", tipo: "Legume", imagemUrl: null, unidadePadrao: "kg" },
      { cdProduto: 3, nome: "Produto", tipo: "", imagemUrl: "x.png", unidadePadrao: "kg" },
    ]);
  });

  it("busca e salva as escolhas no formato { produtos: [{ cdProduto }] }", async () => {
    const api = apiMock();
    api.get.mockResolvedValue([1, 4]);
    api.post.mockResolvedValue({});
    const service = new ApiCatalogService(api);
    expect(await service.getMyProductIds("a@b.c")).toEqual([1, 4]);
    expect(api.get).toHaveBeenCalledWith("/api/produtor/meus-produtos?email=a%40b.c");
    await service.saveMyProductIds("a@b.c", [1, 5]);
    expect(api.post).toHaveBeenCalledWith("/api/produtor/meus-produtos", {
      email: "a@b.c", produtos: [{ cdProduto: 1 }, { cdProduto: 5 }],
    });
  });

  it("envia a sugestão em formData e usa o identificador real da API", async () => {
    const api = apiMock();
    api.postForm.mockResolvedValue({ id: 47, status: "EM_ANALISE" });
    const appendFile = jest.fn().mockResolvedValue(undefined);
    const attachment = { uri: "file:///a.jpg", name: "a.jpg", mimeType: "image/jpeg" };
    const suggestion = { nomeProduto: " Pitaya ", descricao: "Roxa", precoSugerido: "12", attachment };
    const id = await new ApiCatalogService(api, appendFile).suggestProduct("a@b.c", suggestion);
    const [path, form] = api.postForm.mock.calls[0];
    expect(path).toBe("/api/produtor/sugestao");
    expect((form as FormData).get("emailProdutor")).toBe("a@b.c");
    expect((form as FormData).get("nomeProduto")).toBe("Pitaya");
    expect((form as FormData).get("precoSugerido")).toBe("12");
    expect(appendFile).toHaveBeenCalledWith(form, "file", attachment);
    expect(id).toBe("47");
  });

  it("busca sugestões do backend incluindo aprovação e recusa com motivo", async () => {
    const api = apiMock();
    api.get.mockResolvedValue([
      { id: 7, nomeProduto: "Cacau", descricao: null, precoSugerido: 28, status: "EM_ANALISE", motivo: null, decididoEm: null, criadoEm: "2026-11-13T10:00:00Z" },
      { id: 6, nomeProduto: "Jabuticaba", descricao: "", precoSugerido: 12, status: "APROVADA", motivo: null, decididoEm: "2026-10-27T10:00:00Z", criadoEm: "2026-10-26T10:00:00Z" },
      { id: 5, nomeProduto: "Chicória", descricao: "", precoSugerido: null, status: "RECUSADA", motivo: "Já existe", decididoEm: "2026-10-26T10:00:00Z", criadoEm: "2026-10-25T10:00:00Z" },
    ]);
    const list = await new ApiCatalogService(api).listSuggestions("a@b.c");
    expect(api.get).toHaveBeenCalledWith("/api/produtor/sugestao");
    expect(list).toEqual([
      { id: "7", nomeProduto: "Cacau", descricao: "", precoSugerido: 28, status: "EM_ANALISE", motivo: undefined, decididoEm: null, criadoEm: "2026-11-13T10:00:00Z" },
      { id: "6", nomeProduto: "Jabuticaba", descricao: "", precoSugerido: 12, status: "APROVADA", motivo: undefined, decididoEm: "2026-10-27T10:00:00Z", criadoEm: "2026-10-26T10:00:00Z" },
      { id: "5", nomeProduto: "Chicória", descricao: "", precoSugerido: null, status: "RECUSADA", motivo: "Já existe", decididoEm: "2026-10-26T10:00:00Z", criadoEm: "2026-10-25T10:00:00Z" },
    ]);
  });

  it("desfaz somente a sugestão pendente na API (sem alterar serviço local)", async () => {
    const api = apiMock();
    await new ApiCatalogService(api).withdrawSuggestion("a@b.c", "47");
    expect(api.delete).toHaveBeenCalledWith("/api/produtor/sugestao?id=47");
    await expect(new ApiCatalogService(api).withdrawSuggestion("a@b.c", "s-novo-1")).rejects.toThrow();
  });
});
