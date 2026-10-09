import { muralDemands, offerDemands } from "@/lib/produtor/demands";
import { selectedProductNames } from "@/lib/produtor/catalog";
import { DEFAULT_MY_PRODUCT_IDS, MOCK_PRODUCTS } from "./catalogData";
import { seedDemands } from "./demandData";
import { MOCK_MARKET, MOCK_PRICE_SIGNALS, seedMyPrices } from "./priceData";
import { priceFit } from "@/lib/pricing/fit";
import { priceKey } from "@/lib/pricing/price";
import { suggestPrice } from "@/lib/pricing/suggestion";

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

  describe("preços de exemplo", () => {
    const keys = new Set(MOCK_PRODUCTS.map((p) => priceKey(p.nome)));

    it("só falam de produtos do catálogo", () => {
      for (const key of Object.keys(MOCK_PRICE_SIGNALS)) expect(keys.has(key)).toBe(true);
      for (const item of MOCK_MARKET) expect(keys.has(priceKey(item.produto))).toBe(true);
    });

    it("todo produto escolhido por padrão tem preço sugerido e dados de venda", () => {
      for (const name of myNames) {
        expect(suggestPrice(MOCK_PRICE_SIGNALS[priceKey(name)] ?? [])).not.toBeNull();
        expect(MOCK_MARKET.some((item) => priceKey(item.produto) === priceKey(name))).toBe(true);
      }
    });

    it("os preços de exemplo do produtor são válidos e de produtos do catálogo", () => {
      for (const [key, price] of Object.entries(seedMyPrices("a@b.com"))) {
        expect(keys.has(key)).toBe(true);
        expect(price).toBeGreaterThan(0);
      }
    });

    it("há um preço que cabe no pedido do Mural e outro que passa dele", () => {
      const mine = seedMyPrices(ME);
      const fits = (produto: string) => {
        const demand = demands.find((d) => d.produto === produto && d.status === "ABERTA")!;
        return priceFit(mine[priceKey(produto)] ?? null, demand.precoMedio).fit;
      };
      expect(fits("Alface")).toBe("within");
      expect(fits("Tomate")).toBe("above");
    });
  });
});
