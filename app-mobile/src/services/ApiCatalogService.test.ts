import { ApiCatalogService } from "./ApiCatalogService";

const local = {
  suggestProduct: jest.fn().mockResolvedValue("s-1"),
  withdrawSuggestion: jest.fn().mockResolvedValue(undefined),
  listSuggestions: jest.fn().mockResolvedValue([]),
};

describe("ApiCatalogService", () => {
  it("lista os produtos ativos e sempre por kg", async () => {
    const api = {
      get: jest.fn().mockResolvedValue([
        { cdProduto: 1, nome: "Tomate", tipo: "Legume", imagemUrl: "", unidadePadrao: "Caixas", status: "ATIVO" },
        { cdProduto: 2, nome: "Velho", tipo: "Fruta", imagemUrl: null, status: "INATIVO" },
        { cdProduto: 3, nome: null, tipo: null, imagemUrl: "x.png" },
      ]),
      post: jest.fn(),
      postForm: jest.fn(),
    };

    const products = await new ApiCatalogService(api, local).listProducts();

    expect(api.get).toHaveBeenCalledWith("/api/produtos");
    expect(products).toEqual([
      { cdProduto: 1, nome: "Tomate", tipo: "Legume", imagemUrl: null, unidadePadrao: "kg" },
      { cdProduto: 3, nome: "Produto", tipo: "", imagemUrl: "x.png", unidadePadrao: "kg" },
    ]);
  });

  it("busca e salva as escolhas no formato { produtos: [{ cdProduto }] }", async () => {
    const api = {
      get: jest.fn().mockResolvedValue([1, 4]),
      post: jest.fn().mockResolvedValue({}),
      postForm: jest.fn(),
    };
    const service = new ApiCatalogService(api, local);

    expect(await service.getMyProductIds("a@b.c")).toEqual([1, 4]);
    expect(api.get).toHaveBeenCalledWith("/api/produtor/meus-produtos?email=a%40b.c");

    await service.saveMyProductIds("a@b.c", [1, 5]);
    expect(api.post).toHaveBeenCalledWith("/api/produtor/meus-produtos", {
      email: "a@b.c",
      produtos: [{ cdProduto: 1 }, { cdProduto: 5 }],
    });
  });

  it("envia a sugestão em formData e guarda o registro local", async () => {
    const api = { get: jest.fn(), post: jest.fn(), postForm: jest.fn().mockResolvedValue({}) };
    const appendFile = jest.fn().mockResolvedValue(undefined);
    const attachment = { uri: "file:///a.jpg", name: "a.jpg", mimeType: "image/jpeg" };
    const suggestion = { nomeProduto: " Pitaya ", descricao: "Roxa", precoSugerido: "12", attachment };

    const id = await new ApiCatalogService(api, local, appendFile).suggestProduct("a@b.c", suggestion);

    const [path, form] = api.postForm.mock.calls[0];
    expect(path).toBe("/api/produtor/sugestao");
    expect((form as FormData).get("emailProdutor")).toBe("a@b.c");
    expect((form as FormData).get("nomeProduto")).toBe("Pitaya");
    expect((form as FormData).get("precoSugerido")).toBe("12");
    expect(appendFile).toHaveBeenCalledWith(form, "file", attachment);
    expect(local.suggestProduct).toHaveBeenCalledWith("a@b.c", suggestion);
    expect(id).toBe("s-1");
  });
});
