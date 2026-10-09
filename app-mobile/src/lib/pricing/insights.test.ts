import { buildInsights, summarizeSignals, type MarketData, type PriceInsight } from "./insights";

const data = (over: Partial<MarketData> = {}): MarketData => ({
  produto: "Tomate",
  unidade: "Caixa",
  askedPrices: [40, 44, 48],
  sales: [
    { price: 42, units: 100 },
    { price: 46, units: 100 },
  ],
  previousUnits: 150,
  ...over,
});

const mine = (prices: Record<string, number> = {}) => prices;

describe("buildInsights", () => {
  it("calcula a média do que os produtores pedem e a média do que foi vendido (ponderada pelo volume)", () => {
    const [insight] = buildInsights([data()], ["Tomate"], mine());
    expect(insight.averageAsked).toBe(44);
    expect(insight.averageSold).toBe(44);
    const [weighted] = buildInsights(
      [
        data({
          sales: [
            { price: 40, units: 300 },
            { price: 50, units: 100 },
          ],
        }),
      ],
      ["Tomate"],
      mine(),
    );
    expect(weighted.averageSold).toBe(42.5);
  });

  it("diz se está vendendo mais, igual ou menos que no período anterior", () => {
    expect(buildInsights([data({ previousUnits: 100 })], ["Tomate"], mine())[0]).toMatchObject({
      signal: "up",
      change: 1,
    });
    expect(buildInsights([data({ previousUnits: 200 })], ["Tomate"], mine())[0]).toMatchObject({
      signal: "steady",
      change: 0,
    });
    expect(buildInsights([data({ previousUnits: 400 })], ["Tomate"], mine())[0]).toMatchObject({
      signal: "down",
      change: -0.5,
    });
  });

  it("sem período anterior, vendendo algo conta como alta, sem percentual", () => {
    expect(buildInsights([data({ previousUnits: 0 })], ["Tomate"], mine())[0]).toMatchObject({
      signal: "up",
      change: null,
    });
  });

  it("sem nenhuma venda, não há média vendida", () => {
    const [insight] = buildInsights([data({ sales: [], previousUnits: 0 })], ["Tomate"], mine());
    expect(insight).toMatchObject({ averageSold: null, soldUnits: 0, signal: "steady" });
  });

  it("compara o preço do produtor com a média pedida", () => {
    const base = (price: number) => buildInsights([data()], ["Tomate"], mine({ tomate: price }))[0];
    expect(base(52)).toMatchObject({ position: "above" });
    expect(base(44.5)).toMatchObject({ position: "near" });
    expect(base(38)).toMatchObject({ position: "below" });
    expect(buildInsights([data()], ["Tomate"], mine())[0]).toMatchObject({ position: "none", myPrice: null });
  });

  it("dá um conselho pelo conjunto: acima da média sem vendas crescendo, sugere baixar", () => {
    const insight = buildInsights([data({ previousUnits: 400 })], ["Tomate"], mine({ tomate: 52 }))[0];
    expect(insight.advice).toBe("lower");
  });

  it("abaixo da média e vendas subindo, sugere testar um preço maior", () => {
    const insight = buildInsights([data({ previousUnits: 100 })], ["Tomate"], mine({ tomate: 38 }))[0];
    expect(insight.advice).toBe("raise");
  });

  it("sem preço definido, o conselho é definir", () => {
    expect(buildInsights([data()], ["Tomate"], mine())[0].advice).toBe("setPrice");
  });

  it("nos outros casos, mantém", () => {
    expect(buildInsights([data({ previousUnits: 100 })], ["Tomate"], mine({ tomate: 52 }))[0].advice).toBe("keep");
    expect(buildInsights([data()], ["Tomate"], mine({ tomate: 44 }))[0].advice).toBe("keep");
  });

  it("mostra só os produtos do catálogo do produtor, os mais vendidos primeiro", () => {
    const list = buildInsights(
      [
        data({ produto: "Alface", sales: [{ price: 3, units: 10 }] }),
        data({ produto: "Tomate" }),
        data({ produto: "Banana", sales: [{ price: 30, units: 500 }] }),
      ],
      ["tomate", "ALFACE"],
      mine(),
    );
    expect(list.map((item) => item.produto)).toEqual(["Tomate", "Alface"]);
  });
});

describe("summarizeSignals", () => {
  const insight = (signal: PriceInsight["signal"]) => ({ signal }) as PriceInsight;

  it("conta quantos produtos vendem mais, estável e menos", () => {
    const list = [insight("up"), insight("down"), insight("down"), insight("steady")];
    expect(summarizeSignals(list)).toEqual({ up: 1, steady: 1, down: 2 });
  });

  it("sem produtos, tudo zero", () => {
    expect(summarizeSignals([])).toEqual({ up: 0, steady: 0, down: 0 });
  });
});
