import type { Demand } from "@/types/produtor";
import { filterOffers, offerCounts, sortMural, sortOffers } from "./demandView";

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
const ids = (list: Demand[]) => list.map((d) => d.id);
const mine = (quantidade: number) => ({ emailProdutor: ME, quantidade });

describe("sortMural", () => {
  const list = [
    demand("a", { produto: "Cenoura", precoMedio: 5, criadoEm: "2026-10-01T00:00:00.000Z", quantidade: 100 }),
    demand("b", { produto: "Alface", precoMedio: null, criadoEm: "2026-10-03T00:00:00.000Z", quantidade: 40 }),
    demand("c", { produto: "Banana", precoMedio: 30, criadoEm: "2026-10-02T00:00:00.000Z", quantidade: 300, ofertas: [{ emailProdutor: "x@y.com", quantidade: 250 }] }),
  ];

  it("mais recentes primeiro", () => {
    expect(ids(sortMural(list, "recent"))).toEqual(["b", "c", "a"]);
  });

  it("maior preço primeiro, sem preço por último", () => {
    expect(ids(sortMural(list, "priceDesc"))).toEqual(["c", "a", "b"]);
  });

  it("o que mais falta primeiro", () => {
    // faltam: a = 100, c = 300 - 250 = 50, b = 40
    expect(ids(sortMural(list, "missingDesc"))).toEqual(["a", "c", "b"]);
  });

  it("nome de A a Z", () => {
    expect(ids(sortMural(list, "nameAsc"))).toEqual(["b", "c", "a"]);
  });

  it("não altera a lista original", () => {
    const before = ids(list);
    sortMural(list, "priceDesc");
    expect(ids(list)).toEqual(before);
  });
});

describe("ofertas: filtro e ordem", () => {
  const list = [
    demand("open1", { produto: "Tomate", ofertas: [mine(90)], criadoEm: "2026-10-02T00:00:00.000Z" }),
    demand("closed1", { produto: "Alface", status: "CONCLUIDA", ofertas: [mine(80)], criadoEm: "2026-10-03T00:00:00.000Z" }),
    demand("open2", { produto: "Banana", ofertas: [{ emailProdutor: "x@y.com", quantidade: 500 }, mine(50)], criadoEm: "2026-10-01T00:00:00.000Z" }),
  ];

  it("filtra em aberto e fechadas", () => {
    expect(ids(filterOffers(list, "open"))).toEqual(["open1", "open2"]);
    expect(ids(filterOffers(list, "closed"))).toEqual(["closed1"]);
    expect(ids(filterOffers(list, "all"))).toEqual(["open1", "closed1", "open2"]);
  });

  it("conta cada grupo", () => {
    expect(offerCounts(list)).toEqual({ all: 3, open: 2, closed: 1 });
  });

  it("ordena pelas mais recentes", () => {
    expect(ids(sortOffers(list, "recent", ME))).toEqual(["closed1", "open1", "open2"]);
  });

  it("ordena pela quantidade que a própria pessoa ofertou, não pela dos outros", () => {
    // open2 tem 500 de outro produtor, mas só 50 são dela.
    expect(ids(sortOffers(list, "offeredDesc", ME))).toEqual(["open1", "closed1", "open2"]);
  });

  it("ordena por nome de A a Z", () => {
    expect(ids(sortOffers(list, "nameAsc", ME))).toEqual(["closed1", "open2", "open1"]);
  });
});
