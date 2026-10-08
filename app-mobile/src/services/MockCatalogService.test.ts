import type { CatalogProduct, ProductSuggestion, SuggestionRecord } from "@/types/produtor";
import { MockCatalogService } from "./MockCatalogService";

const ME = "maria@sitio.com";

const products: CatalogProduct[] = [
  { cdProduto: 1, nome: "Tomate", tipo: "Legume", imagemUrl: null, unidadePadrao: "Kg" },
  { cdProduto: 2, nome: "Alface", tipo: "Verdura", imagemUrl: null, unidadePadrao: "Maço" },
];

const suggestion: ProductSuggestion = {
  nomeProduto: "Pitaya Vermelha",
  descricao: "Cultivo orgânico",
  precoSugerido: "8.50",
  attachment: null,
};

function createService() {
  return new MockCatalogService({ products, defaultMyProductIds: [1], latencyMs: 0 });
}

describe("MockCatalogService", () => {
  it("lista os produtos do catálogo oficial", async () => {
    expect(await createService().listProducts()).toEqual(products);
  });

  it("quem ainda não salvou nada começa com os produtos de exemplo", async () => {
    expect(await createService().getMyProductIds(ME)).toEqual([1]);
  });

  it("guarda as escolhas salvas", async () => {
    const service = createService();

    await service.saveMyProductIds(ME, [1, 2]);

    expect(await service.getMyProductIds(ME)).toEqual([1, 2]);
  });

  it("cada produtor tem as suas escolhas", async () => {
    const service = createService();
    await service.saveMyProductIds(ME, [2]);

    expect(await service.getMyProductIds("joao@fazenda.com")).toEqual([1]);
  });

  it("não deixa quem chamou alterar as escolhas guardadas sem querer", async () => {
    const service = createService();
    const ids = await service.getMyProductIds(ME);
    ids.push(99);

    expect(await service.getMyProductIds(ME)).toEqual([1]);
  });

  it("recebe sugestões de produto novo", async () => {
    const service = createService();

    await service.suggestProduct(ME, suggestion);

    expect(service.getSuggestions()).toEqual([{ emailProdutor: ME, ...suggestion }]);
  });

  describe("sugestões enviadas", () => {
    const seeded: SuggestionRecord = {
      id: "s-seed",
      nomeProduto: "Jabuticaba",
      descricao: "",
      precoSugerido: 12,
      status: "APROVADA",
      criadoEm: "2026-09-01T00:00:00.000Z",
    };

    function serviceWithSeed() {
      return new MockCatalogService({
        products,
        defaultMyProductIds: [1],
        latencyMs: 0,
        seedSuggestions: () => [seeded],
      });
    }

    it("sem exemplo e sem envio, a lista começa vazia", async () => {
      expect(await createService().listSuggestions(ME)).toEqual([]);
    });

    it("traz as sugestões de exemplo", async () => {
      expect(await serviceWithSeed().listSuggestions(ME)).toEqual([seeded]);
    });

    it("uma sugestão nova entra em análise, com preço em número", async () => {
      const service = serviceWithSeed();

      await service.suggestProduct(ME, suggestion);

      const list = await service.listSuggestions(ME);
      expect(list).toHaveLength(2);
      expect(list.find((item) => item.nomeProduto === "Pitaya Vermelha")).toMatchObject({
        status: "EM_ANALISE",
        precoSugerido: 8.5,
        descricao: "Cultivo orgânico",
      });
    });

    it("sem preço informado, guarda nulo", async () => {
      const service = createService();

      await service.suggestProduct(ME, { ...suggestion, precoSugerido: "" });

      expect((await service.listSuggestions(ME))[0].precoSugerido).toBeNull();
    });

    it("cada sugestão tem identificador próprio", async () => {
      const service = createService();
      await service.suggestProduct(ME, suggestion);
      await service.suggestProduct(ME, suggestion);

      const ids = (await service.listSuggestions(ME)).map((item) => item.id);
      expect(new Set(ids).size).toBe(2);
    });

    it("cada produtor vê só as suas", async () => {
      const service = createService();
      await service.suggestProduct(ME, suggestion);

      expect(await service.listSuggestions("outro@sitio.com")).toEqual([]);
    });
  });
});
