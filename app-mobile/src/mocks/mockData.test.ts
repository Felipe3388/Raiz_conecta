import { selectedProductNames } from "@/lib/produtor/catalog";
import { DEFAULT_MY_PRODUCT_IDS, MOCK_PRODUCTS } from "./catalogData";
import { MOCK_PRICE_SIGNALS, seedMyPrices } from "./priceData";
import { priceKey } from "@/lib/pricing/price";
import { suggestPrice } from "@/lib/pricing/suggestion";

describe("dados de exemplo", () => {
  const myNames = selectedProductNames(MOCK_PRODUCTS, DEFAULT_MY_PRODUCT_IDS);

  it("todo produto é vendido por kg", () => {
    expect(MOCK_PRODUCTS.every((product) => product.unidadePadrao === "kg")).toBe(true);
  });

  it("o catálogo tem produtos com id e nome únicos", () => {
    expect(new Set(MOCK_PRODUCTS.map((p) => p.cdProduto)).size).toBe(MOCK_PRODUCTS.length);
    expect(new Set(MOCK_PRODUCTS.map((p) => p.nome)).size).toBe(MOCK_PRODUCTS.length);
  });

  it("todo produto escolhido por padrão existe no catálogo", () => {
    expect(myNames).toHaveLength(DEFAULT_MY_PRODUCT_IDS.length);
  });

  describe("preços de exemplo", () => {
    const keys = new Set(MOCK_PRODUCTS.map((p) => priceKey(p.nome)));

    it("só falam de produtos do catálogo", () => {
      for (const key of Object.keys(MOCK_PRICE_SIGNALS)) expect(keys.has(key)).toBe(true);
    });

    it("todo produto escolhido por padrão tem preço sugerido", () => {
      for (const name of myNames) {
        expect(suggestPrice(MOCK_PRICE_SIGNALS[priceKey(name)] ?? [])).not.toBeNull();
      }
    });

    it("os preços de exemplo do produtor são válidos e de produtos do catálogo", () => {
      for (const [key, price] of Object.entries(seedMyPrices("a@b.com"))) {
        expect(keys.has(key)).toBe(true);
        expect(price).toBeGreaterThan(0);
      }
    });
  });
});
