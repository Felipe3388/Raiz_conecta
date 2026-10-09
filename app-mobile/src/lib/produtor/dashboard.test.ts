import type { Demand } from "@/types/produtor";
import { barShare, buildDashboard, chartRows, MIN_BAR_SHARE } from "./dashboard";

const ME = "maria@sitio.com";

function demand(id: string, overrides: Partial<Demand> = {}): Demand {
  return {
    id,
    produto: "Tomate",
    quantidade: 100,
    unidade: "Caixas",
    precoMedio: 10,
    status: "ABERTA",
    ofertas: [],
    criadoEm: "2026-10-01T10:00:00.000Z",
    ...overrides,
  };
}
const mine = (quantidade: number) => ({ emailProdutor: ME, quantidade });

describe("buildDashboard", () => {
  it("sem nada ainda, tudo zerado", () => {
    expect(buildDashboard({ mural: [], offers: [], email: ME, savedProductCount: 0 })).toEqual({
      openDemands: 0,
      offersCount: 0,
      savedProducts: 0,
      estimatedRevenue: 0,
      revenueByProduct: [],
      opportunities: [],
    });
  });

  it("conta pedidos abertos, ofertas e produtos do catálogo", () => {
    const summary = buildDashboard({
      mural: [demand("m1"), demand("m2")],
      offers: [demand("o1", { ofertas: [mine(10)] })],
      email: ME,
      savedProductCount: 5,
    });
    expect([summary.openDemands, summary.offersCount, summary.savedProducts]).toEqual([2, 1, 5]);
  });

  it("receita estimada é a quantidade que a pessoa ofertou vezes o preço médio", () => {
    const summary = buildDashboard({
      mural: [],
      offers: [
        demand("o1", { precoMedio: 45, ofertas: [{ emailProdutor: "x@y.com", quantidade: 60 }, mine(40)] }),
        demand("o2", { produto: "Alface", precoMedio: 3.2, ofertas: [mine(30)] }),
      ],
      email: ME,
      savedProductCount: 0,
    });
    expect(summary.estimatedRevenue).toBeCloseTo(40 * 45 + 30 * 3.2, 5);
  });

  it("usa o preço combinado na negociação no lugar da estimativa do pedido", () => {
    const summary = buildDashboard({
      mural: [],
      offers: [
        demand("o1", { precoMedio: 45, ofertas: [{ emailProdutor: ME, quantidade: 40, preco: 38 }] }),
        demand("o2", { produto: "Alface", precoMedio: 3.2, ofertas: [mine(30)] }),
      ],
      email: ME,
      savedProductCount: 0,
    });
    expect(summary.estimatedRevenue).toBeCloseTo(40 * 38 + 30 * 3.2, 5);
    expect(summary.revenueByProduct[0]).toEqual({ produto: "Tomate", revenue: 40 * 38 });
  });

  it("oferta com preço combinado conta mesmo se o pedido não tem estimativa", () => {
    const summary = buildDashboard({
      mural: [],
      offers: [demand("o1", { precoMedio: null, ofertas: [{ emailProdutor: ME, quantidade: 10, preco: 5 }] })],
      email: ME,
      savedProductCount: 0,
    });
    expect(summary.estimatedRevenue).toBe(50);
  });

  it("pedido sem preço não entra na receita", () => {
    const summary = buildDashboard({
      mural: [],
      offers: [demand("o1", { precoMedio: null, ofertas: [mine(40)] })],
      email: ME,
      savedProductCount: 0,
    });
    expect(summary.estimatedRevenue).toBe(0);
  });

  it("agrupa a receita por produto, do maior para o menor", () => {
    const summary = buildDashboard({
      mural: [],
      offers: [
        demand("o1", { produto: "Tomate", precoMedio: 10, ofertas: [mine(5)] }),
        demand("o2", { produto: "Banana", precoMedio: 20, ofertas: [mine(10)] }),
        demand("o3", { produto: "tomate", precoMedio: 10, ofertas: [mine(10)] }),
      ],
      email: ME,
      savedProductCount: 0,
    });
    expect(summary.revenueByProduct).toEqual([
      { produto: "Banana", revenue: 200 },
      { produto: "Tomate", revenue: 150 },
    ]);
  });

  it("maiores oportunidades: o que ainda falta vezes o preço, no máximo três", () => {
    const summary = buildDashboard({
      mural: [
        demand("m1", { quantidade: 100, precoMedio: 10 }),
        demand("m2", { quantidade: 100, precoMedio: 50, ofertas: [{ emailProdutor: "x@y.com", quantidade: 90 }] }),
        demand("m3", { quantidade: 10, precoMedio: 100 }),
        demand("m4", { quantidade: 200, precoMedio: 20 }),
        demand("m5", { quantidade: 50, precoMedio: null }),
      ],
      offers: [],
      email: ME,
      savedProductCount: 0,
    });
    expect(summary.opportunities.map((o) => [o.demand.id, o.value])).toEqual([
      ["m4", 4000],
      ["m1", 1000],
      ["m3", 1000],
    ]);
  });
});

describe("barShare", () => {
  it("o maior valor ocupa a barra toda e os outros ficam proporcionais", () => {
    expect(barShare(200, 200)).toBe(1);
    expect(barShare(100, 200)).toBe(0.5);
  });

  it("valor pequeno ainda aparece como uma barrinha", () => {
    expect(barShare(1, 1000)).toBeCloseTo(MIN_BAR_SHARE);
  });

  it("zero ou sem máximo não desenha barra", () => {
    expect(barShare(0, 100)).toBe(0);
    expect(barShare(50, 0)).toBe(0);
    expect(barShare(-5, 100)).toBe(0);
  });

  it("nunca passa da barra cheia", () => {
    expect(barShare(300, 200)).toBe(1);
  });
});

describe("chartRows", () => {
  const rows = (...values: number[]) => values.map((revenue, index) => ({ produto: `P${index + 1}`, revenue }));

  it("poucos produtos aparecem todos, sem 'Outros'", () => {
    expect(chartRows(rows(50, 30, 10), 5)).toEqual(rows(50, 30, 10));
  });

  it("passando do limite, o resto vira uma linha 'Outros produtos' somada", () => {
    expect(chartRows(rows(50, 40, 30, 20, 10), 3)).toEqual([
      { produto: "P1", revenue: 50 },
      { produto: "P2", revenue: 40 },
      { produto: "Outros produtos", revenue: 60 },
    ]);
  });

  it("no limite exato não esconde ninguém", () => {
    expect(chartRows(rows(5, 4, 3), 3)).toHaveLength(3);
  });

  it("ignora produtos sem receita (oferta de preço não informado)", () => {
    expect(chartRows(rows(50, 0), 5)).toEqual(rows(50));
  });
});
