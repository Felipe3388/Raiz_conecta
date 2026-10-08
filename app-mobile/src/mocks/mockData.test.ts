import { muralDemands, offerDemands } from "@/lib/produtor/demands";
import { selectedProductNames } from "@/lib/produtor/catalog";
import { DEFAULT_MY_PRODUCT_IDS, MOCK_PRODUCTS } from "./catalogData";
import { seedDemands } from "./demandData";

const ME = "maria@sitio.com";

describe("dados de exemplo", () => {
  const demands = seedDemands(ME);
  const myNames = selectedProductNames(MOCK_PRODUCTS, DEFAULT_MY_PRODUCT_IDS);

  it("o catálogo tem produtos com id e nome únicos", () => {
    expect(new Set(MOCK_PRODUCTS.map((p) => p.cdProduto)).size).toBe(MOCK_PRODUCTS.length);
    expect(new Set(MOCK_PRODUCTS.map((p) => p.nome)).size).toBe(MOCK_PRODUCTS.length);
  });

  it("todo produto escolhido por padrão existe no catálogo", () => {
    expect(myNames).toHaveLength(DEFAULT_MY_PRODUCT_IDS.length);
  });

  it("toda demanda é de um produto do catálogo", () => {
    const names = new Set(MOCK_PRODUCTS.map((p) => p.nome));
    for (const demand of demands) expect(names.has(demand.produto)).toBe(true);
  });

  it("o Mural de exemplo tem várias oportunidades", () => {
    expect(muralDemands(demands, ME, myNames).length).toBeGreaterThanOrEqual(4);
  });

  it("a aba Ofertas de exemplo tem uma oferta aberta e uma fechada", () => {
    const mine = offerDemands(demands, ME);
    expect(mine.some((d) => d.status === "ABERTA")).toBe(true);
    expect(mine.some((d) => d.status === "CONCLUIDA")).toBe(true);
  });

  it("existem demandas de produtos que o produtor ainda não escolheu", () => {
    const hidden = demands.filter((d) => !myNames.includes(d.produto) && d.status === "ABERTA");
    expect(hidden.length).toBeGreaterThanOrEqual(2);
  });

  it("nenhuma demanda tem mais ofertas do que o pedido", () => {
    for (const demand of demands) {
      const total = demand.ofertas.reduce((sum, o) => sum + o.quantidade, 0);
      expect(total).toBeLessThanOrEqual(demand.quantidade);
    }
  });
});
