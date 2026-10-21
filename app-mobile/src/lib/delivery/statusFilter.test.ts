import { describeOrder } from "./orderCard";
import { groupOrders } from "./orders";
import { filterByStatus, statusOptions } from "./statusFilter";
import type { Delivery } from "@/types/delivery";

const TODAY = new Date("2026-10-13T12:00:00");

function delivery(id: string, mercado: string, overrides: Partial<Delivery> = {}): Delivery {
  return {
    id,
    propostaId: `p-${mercado}`,
    mercado,
    produto: "Abacaxi",
    unidade: "Kg",
    quantidade: 10,
    preco: 5,
    dueDate: "2026-10-16",
    weighings: [],
    handedOverAt: null,
    handedOverOutOfRange: false,
    receipt: null,
    ...overrides,
  };
}

const weighed = [{ id: "w", kg: 10, source: "BALANCA" as const, at: "x" }];
const cards = groupOrders([
  delivery("1", "Falta"),
  delivery("2", "Pronto", { weighings: weighed }),
  delivery("3", "Metade"),
  delivery("4", "Metade", { weighings: weighed }),
  delivery("5", "Saiu", { weighings: weighed, handedOverAt: "2026-10-13T10:00:00" }),
]).map((order) => describeOrder(order, TODAY));

const names = (list: typeof cards) => list.map((card) => card.mercado).sort();

describe("filterByStatus", () => {
  it("todos mostra tudo", () => {
    expect(filterByStatus(cards, "all")).toHaveLength(4);
  });

  it("falta pesar: pedidos com algum produto ainda sem peso", () => {
    expect(names(filterByStatus(cards, "toWeigh"))).toEqual(["Falta", "Metade"]);
  });

  it("para a logística: pedidos com todos os produtos pesados que ainda estão com o produtor", () => {
    expect(names(filterByStatus(cards, "toHandOver"))).toEqual(["Pronto"]);
  });

  it("um pedido nunca aparece nos dois", () => {
    const both = filterByStatus(cards, "toWeigh").filter((card) => filterByStatus(cards, "toHandOver").includes(card));
    expect(both).toEqual([]);
  });
});

describe("statusOptions", () => {
  it("traz o rótulo e a quantidade de cada filtro", () => {
    expect(statusOptions(cards)).toEqual([
      { value: "all", label: "Todos", count: 4 },
      { value: "toWeigh", label: "Falta pesar", count: 2 },
      { value: "toHandOver", label: "Para a logística", count: 1 },
    ]);
  });
});
