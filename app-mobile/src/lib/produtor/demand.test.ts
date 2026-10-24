import type { Proposal, ProposalItem, ProposalQuantities } from "@/types/proposal";
import { demandByProduct, demandPercent, fulfilmentPercent } from "./demand";

const NOW = new Date("2026-10-13T12:00:00.000Z");
const inMinutes = (minutes: number) => new Date(NOW.getTime() + minutes * 60_000).toISOString();

function item(overrides: Partial<ProposalItem> = {}): ProposalItem {
  return { id: "i1", produto: "Tomate", quantidade: 40, unidade: "Kg", preco: 5, aceita: null, ...overrides };
}

function proposal(id: string, mercado: string, itens: ProposalItem[], overrides: Partial<Proposal> = {}): Proposal {
  return {
    id,
    numero: 1000,
    mercado,
    itens,
    entrega: "2026-10-16",
    status: "PENDENTE",
    recebidaEm: inMinutes(-1),
    expiraEm: inMinutes(20),
    respondidaEm: null,
    ...overrides,
  };
}

describe("fulfilmentPercent (quanto da demanda está atendida)", () => {
  it("é a parte do que foi pedido, de 0 a 100, arredondada", () => {
    expect(fulfilmentPercent(0, 40)).toBe(0);
    expect(fulfilmentPercent(10, 40)).toBe(25);
    expect(fulfilmentPercent(1, 3)).toBe(33);
    expect(fulfilmentPercent(40, 40)).toBe(100);
  });

  it("nunca passa de 100 nem fica negativa, e sem pedido é zero", () => {
    expect(fulfilmentPercent(50, 40)).toBe(100);
    expect(fulfilmentPercent(-5, 40)).toBe(0);
    expect(fulfilmentPercent(10, 0)).toBe(0);
  });
});

describe("demandByProduct (demanda atendida por produto, somando os mercados)", () => {
  const proposals = [
    proposal("a", "Mercado Teste", [item({ id: "a1", quantidade: 40 })]),
    proposal("b", "Empório", [
      item({ id: "b1", quantidade: 20 }),
      item({ id: "b2", produto: "Alface", quantidade: 10, preco: 3 }),
    ]),
  ];

  it("soma o pedido de cada produto nos mercados e conta quantos mercados pedem", () => {
    const lines = demandByProduct(proposals, {}, NOW);
    const tomate = lines.find((line) => line.produto === "Tomate");
    expect(tomate).toMatchObject({ requested: 60, offered: 0, markets: 2, percent: 0, unit: "kg" });
    expect(lines.find((line) => line.produto === "Alface")).toMatchObject({ requested: 10, markets: 1 });
  });

  it("o que o produtor está escolhendo agora conta como oferecido", () => {
    const choices: Record<string, ProposalQuantities> = { a: { a1: 30 }, b: { b1: 10 } };
    const tomate = demandByProduct(proposals, choices, NOW).find((line) => line.produto === "Tomate");
    expect(tomate).toMatchObject({ choosing: 40, offered: 40, percent: 67 });
  });

  it("o que já foi aceito também conta, e o pedido recusado ou expirado fica de fora", () => {
    const all = [
      ...proposals,
      proposal("c", "Mercado Novo", [item({ id: "c1", quantidade: 20, aceita: 15 })], { status: "ACEITA" }),
      proposal("d", "Recusou", [item({ id: "d1", quantidade: 500 })], { status: "RECUSADA" }),
      proposal("e", "Expirou", [item({ id: "e1", quantidade: 500 })], { expiraEm: inMinutes(-1) }),
    ];
    const tomate = demandByProduct(all, {}, NOW).find((line) => line.produto === "Tomate");
    expect(tomate).toMatchObject({ requested: 80, accepted: 15, offered: 15, markets: 3 });
  });

  it("a escolha nunca passa do pedido do mercado", () => {
    const tomate = demandByProduct(proposals, { a: { a1: 999 } }, NOW).find((line) => line.produto === "Tomate");
    expect(tomate?.choosing).toBe(40);
  });

  it("começa pelos produtos de maior demanda", () => {
    expect(demandByProduct(proposals, {}, NOW).map((line) => line.produto)).toEqual(["Tomate", "Alface"]);
  });

  it("sem pedidos, não há linhas", () => {
    expect(demandByProduct([], {}, NOW)).toEqual([]);
  });
});

describe("demandPercent (o total, pelo valor)", () => {
  it("pesa cada produto pelo valor em reais, já que as unidades variam", () => {
    const proposals = [
      proposal("a", "M", [
        item({ id: "a1", quantidade: 10, preco: 10 }),
        item({ id: "a2", produto: "Alface", quantidade: 10, unidade: "Maço", preco: 1 }),
      ]),
    ];
    // Tomate: 10 × 10 = 100 reais, todo oferecido; Alface: 10 × 1 = 10 reais, nada oferecido -> 100 de 110.
    const lines = demandByProduct(proposals, { a: { a1: 10 } }, NOW);
    expect(demandPercent(lines)).toBe(91);
  });

  it("sem demanda é zero", () => {
    expect(demandPercent([])).toBe(0);
  });
});
