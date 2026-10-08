import type { Demand } from "@/types/produtor";
import {
  canOffer,
  clampQuantity,
  filterByProduct,
  findOffer,
  fulfilledQuantity,
  muralDemands,
  offerDemands,
  progressPercent,
  remainingQuantity,
} from "./demands";

const ME = "maria@sitio.com";

function demand(overrides: Partial<Demand> = {}): Demand {
  return {
    id: "d1",
    produto: "Tomate",
    quantidade: 100,
    unidade: "Caixas",
    precoMedio: 45,
    status: "ABERTA",
    ofertas: [],
    criadoEm: "2026-10-01T10:00:00.000Z",
    ...overrides,
  };
}

describe("quantidades da demanda", () => {
  const partial = demand({
    ofertas: [
      { quantidade: 30, emailProdutor: "joao@fazenda.com" },
      { quantidade: 20, emailProdutor: ME },
    ],
  });

  it("soma o que já foi ofertado", () => {
    expect(fulfilledQuantity(partial)).toBe(50);
    expect(fulfilledQuantity(demand())).toBe(0);
  });

  it("calcula o que falta", () => {
    expect(remainingQuantity(partial)).toBe(50);
  });

  it("nunca deixa faltar menos que zero", () => {
    const over = demand({ quantidade: 10, ofertas: [{ quantidade: 15, emailProdutor: ME }] });
    expect(remainingQuantity(over)).toBe(0);
  });

  it("calcula o percentual preenchido entre 0 e 100", () => {
    expect(progressPercent(partial)).toBe(50);
    expect(progressPercent(demand())).toBe(0);
    expect(progressPercent(demand({ quantidade: 10, ofertas: [{ quantidade: 15, emailProdutor: ME }] }))).toBe(100);
  });

  it("demanda de quantidade zero não quebra a conta", () => {
    expect(progressPercent(demand({ quantidade: 0 }))).toBe(0);
  });
});

describe("findOffer", () => {
  it("acha a oferta do produtor, sem diferenciar maiúsculas no e-mail", () => {
    const d = demand({ ofertas: [{ quantidade: 20, emailProdutor: "Maria@Sitio.com" }] });
    expect(findOffer(d, ME)?.quantidade).toBe(20);
  });

  it("devolve nada quando o produtor não ofertou", () => {
    expect(findOffer(demand(), ME)).toBeUndefined();
  });
});

describe("muralDemands", () => {
  const tomate = demand({ id: "tomate", produto: "Tomate" });
  const alface = demand({ id: "alface", produto: "Alface" });
  const mine = demand({ id: "mine", produto: "Cenoura", ofertas: [{ quantidade: 5, emailProdutor: ME }] });
  const closed = demand({ id: "closed", produto: "Tomate", status: "CONCLUIDA" });
  const all = [tomate, alface, mine, closed];

  it("mostra só demandas abertas, dos produtos do produtor e que ele ainda não ofertou", () => {
    const result = muralDemands(all, ME, ["Tomate", "Cenoura"]);
    expect(result.map((d) => d.id)).toEqual(["tomate"]);
  });

  it("compara o nome do produto sem acento nem caixa", () => {
    const abobora = demand({ id: "abobora", produto: "ABÓBORA" });
    expect(muralDemands([abobora], ME, ["abobora"])).toHaveLength(1);
  });

  it("sem produtos no catálogo, o mural fica vazio", () => {
    expect(muralDemands(all, ME, [])).toEqual([]);
  });
});

describe("offerDemands", () => {
  it("lista as demandas em que o produtor fez oferta", () => {
    const mine = demand({ id: "mine", ofertas: [{ quantidade: 5, emailProdutor: ME }] });
    const other = demand({ id: "other", ofertas: [{ quantidade: 5, emailProdutor: "x@y.com" }] });
    expect(offerDemands([mine, other, demand({ id: "none" })], ME).map((d) => d.id)).toEqual(["mine"]);
  });
});

describe("filterByProduct", () => {
  const list = [demand({ id: "a", produto: "Maçã" }), demand({ id: "b", produto: "Tomate" })];

  it("filtra pelo nome do produto sem se importar com acento", () => {
    expect(filterByProduct(list, "maca").map((d) => d.id)).toEqual(["a"]);
  });

  it("busca vazia mantém tudo", () => {
    expect(filterByProduct(list, "")).toHaveLength(2);
  });
});

describe("canOffer", () => {
  it.each([
    [10, 50, true],
    [50, 50, true],
    [51, 50, false],
    [0, 50, false],
    [-3, 50, false],
    [2.5, 50, false],
    [Number.NaN, 50, false],
  ])("oferta de %p com falta de %p: %p", (quantity, remaining, expected) => {
    expect(canOffer(quantity, remaining)).toBe(expected);
  });
});

describe("clampQuantity", () => {
  it("mantém o valor entre 0 e o máximo", () => {
    expect(clampQuantity(5, 10)).toBe(5);
    expect(clampQuantity(99, 10)).toBe(10);
    expect(clampQuantity(-4, 10)).toBe(0);
  });

  it("arredonda para baixo e trata inválido como zero", () => {
    expect(clampQuantity(3.9, 10)).toBe(3);
    expect(clampQuantity(Number.NaN, 10)).toBe(0);
  });
});
