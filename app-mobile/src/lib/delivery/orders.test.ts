import { makeDelivery, weighing } from "./fixtures";
import { groupOrders, orderKeyOf, orderStage } from "./orders";

const handedOver = { handedOverAt: "2026-10-13T12:00:00.000Z" };
const received = (kg: number) => ({ ...handedOver, receipt: { kg, source: "BALANCA" as const, at: "x" } });
const ready = { weighings: [weighing(10)] };

describe("groupOrders (um pedido por mercado e dia)", () => {
  it("junta os produtos do mesmo mercado no mesmo dia", () => {
    const orders = groupOrders([
      makeDelivery({ id: "a", mercado: "Mercado Teste", produto: "Morango", dueDate: "2026-10-16" }),
      makeDelivery({ id: "b", mercado: "mercado teste", produto: "Abacaxi", dueDate: "2026-10-16" }),
      makeDelivery({ id: "c", mercado: "Empório", produto: "Alface", dueDate: "2026-10-16" }),
    ]);
    expect(orders).toHaveLength(2);
    const teste = orders.find((order) => order.mercado === "Mercado Teste");
    expect(teste?.items.map((item) => item.produto)).toEqual(["Abacaxi", "Morango"]);
  });

  it("o mesmo mercado em outro dia é outro pedido", () => {
    const orders = groupOrders([
      makeDelivery({ id: "a", dueDate: "2026-10-13" }),
      makeDelivery({ id: "b", dueDate: "2026-10-16" }),
    ]);
    expect(orders.map((order) => order.dueDate)).toEqual(["2026-10-13", "2026-10-16"]);
  });

  it("ordena por dia e depois pelo nome do mercado", () => {
    const orders = groupOrders([
      makeDelivery({ id: "a", mercado: "Zé", dueDate: "2026-10-13" }),
      makeDelivery({ id: "b", mercado: "Ana", dueDate: "2026-10-16" }),
      makeDelivery({ id: "c", mercado: "Bia", dueDate: "2026-10-13" }),
    ]);
    expect(orders.map((order) => order.mercado)).toEqual(["Bia", "Zé", "Ana"]);
  });

  it("a chave não muda com acento ou maiúsculas", () => {
    expect(orderKeyOf(makeDelivery({ mercado: "Empório São José", dueDate: "2026-10-16" }))).toBe(
      orderKeyOf(makeDelivery({ mercado: "emporio sao jose", dueDate: "2026-10-16" })),
    );
  });

  it("sem entregas, sem pedidos", () => {
    expect(groupOrders([])).toEqual([]);
  });
});

describe("orderStage (a etapa do pedido)", () => {
  it("todos a separar: a separar", () => {
    expect(orderStage([makeDelivery(), makeDelivery({ id: "b" })])).toBe("A_SEPARAR");
  });

  it("vale o item menos adiantado: um ainda sem peso mantém o pedido a separar", () => {
    expect(orderStage([makeDelivery(ready), makeDelivery({ id: "b" })])).toBe("A_SEPARAR");
  });

  it("todos pesados na faixa: pronto", () => {
    expect(orderStage([makeDelivery(ready), makeDelivery({ id: "b", ...ready })])).toBe("PRONTA");
  });

  it("todos entregues à logística: com a logística", () => {
    const item = (id: string) => makeDelivery({ id, ...ready, ...handedOver });
    expect(orderStage([item("a"), item("b")])).toBe("COM_LOGISTICA");
  });

  it("todos recebidos na faixa: recebido; algum fora da faixa: divergente", () => {
    expect(
      orderStage([makeDelivery({ id: "a", ...ready, ...received(10) }), makeDelivery({ id: "b", ...received(10) })]),
    ).toBe("RECEBIDA");
    expect(orderStage([makeDelivery({ id: "a", ...received(10) }), makeDelivery({ id: "b", ...received(7) })])).toBe(
      "DIVERGENTE",
    );
  });

  it("parte já recebida e parte ainda com a logística: com a logística", () => {
    expect(
      orderStage([makeDelivery({ id: "a", ...received(10) }), makeDelivery({ id: "b", ...handedOver, ...ready })]),
    ).toBe("COM_LOGISTICA");
  });

  it("pedido sem itens fica a separar", () => {
    expect(orderStage([])).toBe("A_SEPARAR");
  });
});
