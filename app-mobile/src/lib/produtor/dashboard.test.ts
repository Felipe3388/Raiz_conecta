import type { Proposal } from "@/types/proposal";
import { barShare, buildDashboard, chartRows, MIN_BAR_SHARE } from "./dashboard";

const NOW = new Date("2026-10-13T12:00:00.000Z");
const inMinutes = (minutes: number) => new Date(NOW.getTime() + minutes * 60_000).toISOString();

interface Line {
  produto?: string;
  quantidade?: number;
  preco?: number;
  aceita?: number | null;
}

// Um pedido com um produto só (o suficiente para a maioria dos testes). Num pedido aceito, `aceita` começa igual à
// quantidade oferecida.
function proposal(id: string, overrides: Partial<Proposal> & Line = {}): Proposal {
  const { produto = "Tomate", quantidade = 10, preco = 10, aceita, ...order } = overrides;
  const status = order.status ?? "ACEITA";
  return {
    id,
    numero: 1,
    mercado: "Mercado Teste",
    itens: [
      {
        id: `${id}-i`,
        produto,
        quantidade,
        unidade: "Kg",
        preco,
        aceita: aceita !== undefined ? aceita : status === "ACEITA" ? quantidade : null,
      },
    ],
    entrega: "2026-10-16",
    status: "ACEITA",
    recebidaEm: inMinutes(-60),
    expiraEm: inMinutes(-45),
    respondidaEm: inMinutes(-50),
    ...order,
  };
}
const pending = (id: string, minutesLeft: number, overrides: Partial<Proposal> & Line = {}) =>
  proposal(id, { status: "PENDENTE", expiraEm: inMinutes(minutesLeft), respondidaEm: null, ...overrides });

const summarize = (proposals: Proposal[], savedProductCount = 0) =>
  buildDashboard({ proposals, savedProductCount, now: NOW });

describe("buildDashboard", () => {
  it("sem nada ainda, tudo zerado", () => {
    expect(summarize([])).toEqual({
      pendingCount: 0,
      acceptedCount: 0,
      savedProducts: 0,
      estimatedRevenue: 0,
      revenueByProduct: [],
      urgent: [],
    });
  });

  it("conta pendentes dentro do prazo, aceitas e produtos do catálogo", () => {
    const summary = summarize(
      [
        pending("p1", 10),
        pending("p2", 5),
        pending("vencida", -2),
        proposal("a1"),
        proposal("r1", { status: "RECUSADA" }),
      ],
      5,
    );
    expect([summary.pendingCount, summary.acceptedCount, summary.savedProducts]).toEqual([2, 1, 5]);
  });

  it("receita estimada: só as propostas aceitas, quantidade vezes o preço fixo", () => {
    const summary = summarize([
      proposal("a1", { quantidade: 40, preco: 4.1 }),
      proposal("a2", { produto: "Alface", quantidade: 30, preco: 2.69 }),
      pending("p1", 10, { quantidade: 100, preco: 50 }),
      proposal("r1", { status: "RECUSADA", quantidade: 100, preco: 50 }),
    ]);
    expect(summary.estimatedRevenue).toBeCloseTo(40 * 4.1 + 30 * 2.69, 5);
  });

  it("a receita conta só o que foi aceito: aceitar parte do pedido paga parte", () => {
    const partial = proposal("a1", { produto: "Alface", quantidade: 30, aceita: 20, preco: 2 });
    const refused = proposal("r1", { status: "RECUSADA", aceita: 0 });
    const summary = summarize([partial, refused]);
    expect(summary.estimatedRevenue).toBe(40);
    expect(summary.revenueByProduct).toEqual([{ produto: "Alface", revenue: 40 }]);
  });

  it("um pedido com vários produtos soma cada produto aceito", () => {
    const order = proposal("a1", { produto: "Morango", quantidade: 30, preco: 12 });
    order.itens.push({ id: "a1-b", produto: "Abacaxi", quantidade: 40, unidade: "Kg", preco: 4, aceita: 0 });
    order.itens.push({ id: "a1-c", produto: "Alface", quantidade: 10, unidade: "Kg", preco: 2, aceita: 5 });
    const summary = summarize([order]);
    expect(summary.estimatedRevenue).toBe(370);
    expect(summary.revenueByProduct.map((row) => row.produto)).toEqual(["Morango", "Alface"]);
  });

  it("agrupa a receita por produto, do maior para o menor", () => {
    const summary = summarize([
      proposal("a1", { produto: "Tomate", quantidade: 5, preco: 10 }),
      proposal("a2", { produto: "Banana", quantidade: 10, preco: 20 }),
      proposal("a3", { produto: "tomate", quantidade: 5, preco: 10 }),
    ]);
    expect(summary.revenueByProduct).toEqual([
      { produto: "Banana", revenue: 200 },
      { produto: "Tomate", revenue: 100 },
    ]);
  });

  it("as mais urgentes são as pendentes com o prazo mais curto, no máximo três", () => {
    const summary = summarize([
      pending("p1", 12),
      pending("p2", 3),
      pending("p3", 8),
      pending("p4", 14),
      pending("vencida", -1),
      proposal("a1"),
    ]);
    expect(summary.urgent.map((item) => item.id)).toEqual(["p2", "p3", "p1"]);
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
