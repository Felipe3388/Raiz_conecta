import { makeDelivery, weighing } from "./fixtures";
import { groupOrders } from "./orders";
import { describeOrder } from "./orderCard";

const today = new Date(2026, 9, 13, 9, 30);
const handedOver = { handedOverAt: "2026-10-13T12:00:00.000Z" };
const received = (kg: number) => ({ ...handedOver, receipt: { kg, source: "BALANCA" as const, at: "x" } });

const order = (...deliveries: Parameters<typeof groupOrders>[0]) => groupOrders(deliveries)[0];
const base = { mercado: "Mercado Teste", dueDate: "2026-10-13" };

describe("describeOrder (tudo o que o cartão do pedido mostra)", () => {
  it("pedido novo: a separar, nada pesado, só dá para pesar", () => {
    const card = describeOrder(
      order(
        makeDelivery({ ...base, id: "a", produto: "Morango", quantidade: 30 }),
        makeDelivery({ ...base, id: "b", produto: "Abacaxi", quantidade: 40 }),
      ),
      today,
    );

    expect(card).toMatchObject({
      mercado: "Mercado Teste",
      stage: "A_SEPARAR",
      late: false,
      dayLabel: "Hoje, ter 13/10",
      itemCount: 2,
      weighedItems: 0,
      expectedKg: 70,
      weighedKg: 0,
      percent: 0,
      actions: ["WEIGH"],
    });
    expect(card.items.map((item) => item.delivery.produto)).toEqual(["Abacaxi", "Morango"]);
  });

  it("com todos os produtos pesados já dá para entregar à logística", () => {
    const card = describeOrder(
      order(
        makeDelivery({ ...base, id: "a", weighings: [weighing(10)] }),
        makeDelivery({ ...base, id: "b", produto: "Outro", weighings: [weighing(9.9, "x")] }),
      ),
      today,
    );
    expect(card.stage).toBe("PRONTA");
    expect(card.weighedItems).toBe(2);
    expect(card.actions).toEqual(["WEIGH", "HAND_OVER"]);
  });

  it("falta pesar um produto: não entrega ainda", () => {
    const card = describeOrder(
      order(
        makeDelivery({ ...base, id: "a", weighings: [weighing(10)] }),
        makeDelivery({ ...base, id: "b", produto: "Outro" }),
      ),
      today,
    );
    expect(card.weighedItems).toBe(1);
    expect(card.actions).toEqual(["WEIGH"]);
  });

  it("o progresso soma só até o esperado de cada produto: um excesso não cobre a falta de outro", () => {
    const card = describeOrder(
      order(
        makeDelivery({ ...base, id: "a", weighings: [weighing(15)] }),
        makeDelivery({ ...base, id: "b", produto: "Outro" }),
      ),
      today,
    );
    expect(card.percent).toBe(50);
    expect(card.weighedKg).toBe(15);
  });

  it("produto pesado fora da faixa fica listado para avisar antes de entregar", () => {
    const card = describeOrder(
      order(
        makeDelivery({ ...base, id: "a", weighings: [weighing(10)] }),
        makeDelivery({ ...base, id: "b", produto: "Outro", weighings: [weighing(6, "x")] }),
      ),
      today,
    );
    expect(card.outOfRange.map((item) => item.delivery.produto)).toEqual(["Outro"]);
    expect(card.actions).toContain("HAND_OVER");
  });

  it("com a logística: só resta o mercado receber", () => {
    const card = describeOrder(
      order(makeDelivery({ ...base, id: "a", weighings: [weighing(10)], ...handedOver })),
      today,
    );
    expect(card.stage).toBe("COM_LOGISTICA");
    expect(card.actions).toEqual(["RECEIVE"]);
  });

  it("atrasado: o dia passou e ainda não saiu das mãos do produtor", () => {
    const card = describeOrder(order(makeDelivery({ ...base, dueDate: "2026-10-09" })), today);
    expect(card.late).toBe(true);
    expect(card.dayLabel).toBe("sex, 09/10");
  });

  it("valor: estimado pelos preços fixos até o mercado conferir; depois, pelo peso que o mercado mediu", () => {
    const estimated = describeOrder(
      order(
        makeDelivery({ ...base, id: "a", quantidade: 10, preco: 4 }),
        makeDelivery({ ...base, id: "b", produto: "Outro", quantidade: 10, preco: 5 }),
      ),
      today,
    );
    expect(estimated.value).toBe(90);
    expect(estimated.valueConfirmed).toBe(false);

    const confirmed = describeOrder(
      order(
        makeDelivery({ ...base, id: "a", quantidade: 10, preco: 4, ...received(10) }),
        makeDelivery({ ...base, id: "b", produto: "Outro", quantidade: 10, preco: 5, ...received(9.8) }),
      ),
      today,
    );
    expect(confirmed.stage).toBe("RECEBIDA");
    expect(confirmed.value).toBe(89);
    expect(confirmed.valueConfirmed).toBe(true);
    expect(confirmed.actions).toEqual([]);
  });

  it("recebido com divergência: marca os produtos divergentes", () => {
    const card = describeOrder(
      order(
        makeDelivery({ ...base, id: "a", ...received(10) }),
        makeDelivery({ ...base, id: "b", produto: "Outro", ...received(7) }),
      ),
      today,
    );
    expect(card.stage).toBe("DIVERGENTE");
    expect(card.divergent.map((item) => item.delivery.produto)).toEqual(["Outro"]);
  });
});
