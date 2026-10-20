import { makeDelivery, weighing } from "./fixtures";
import { groupOrders } from "./orders";
import { buildPickList, dayChips, DONE_FILTER, filterOrders, isLate, pendingCount } from "./plan";

// Terça, 13/10/2026. Os dias de entrega são terça (13/10) e sexta (16/10).
const today = new Date(2026, 9, 13, 9, 30);
const handedOver = { handedOverAt: "2026-10-13T12:00:00.000Z" };
const received = { ...handedOver, receipt: { kg: 10, source: "BALANCA" as const, at: "x" } };
const orders = (...deliveries: Parameters<typeof groupOrders>[0]) => groupOrders(deliveries);

describe("isLate", () => {
  it("atrasada: o dia passou e o produtor ainda não entregou", () => {
    expect(isLate(makeDelivery({ dueDate: "2026-10-09" }), today)).toBe(true);
    expect(isLate(makeDelivery({ dueDate: "2026-10-09", weighings: [weighing(10)] }), today)).toBe(true);
  });

  it("hoje e o futuro não estão atrasados", () => {
    expect(isLate(makeDelivery({ dueDate: "2026-10-13" }), today)).toBe(false);
    expect(isLate(makeDelivery({ dueDate: "2026-10-16" }), today)).toBe(false);
  });

  it("quem já entregou à logística não está atrasado", () => {
    expect(isLate(makeDelivery({ dueDate: "2026-10-09", ...handedOver }), today)).toBe(false);
  });
});

describe("dayChips (as abas de dia: só terça e sexta)", () => {
  it("sempre tem os dois próximos dias de entrega, mesmo vazios", () => {
    expect(dayChips([], today)).toEqual([
      { id: "2026-10-13", label: "Hoje, ter 13/10", count: 0 },
      { id: "2026-10-16", label: "sex, 16/10", count: 0 },
    ]);
  });

  it("num dia sem entrega, os dois próximos são os de entrega", () => {
    expect(dayChips([], new Date(2026, 9, 14, 8)).map((chip) => chip.id)).toEqual(["2026-10-16", "2026-10-20"]);
  });

  it("conta os pedidos (não os produtos) de cada dia e acrescenta dias mais distantes que têm pedido", () => {
    const chips = dayChips(
      orders(
        makeDelivery({ id: "a", mercado: "Mercado A", produto: "Morango", dueDate: "2026-10-13" }),
        makeDelivery({ id: "b", mercado: "Mercado A", produto: "Abacaxi", dueDate: "2026-10-13" }),
        makeDelivery({ id: "c", mercado: "Mercado B", dueDate: "2026-10-13" }),
        makeDelivery({ id: "d", mercado: "Mercado A", dueDate: "2026-10-20" }),
      ),
      today,
    );
    expect(chips).toEqual([
      { id: "2026-10-13", label: "Hoje, ter 13/10", count: 2 },
      { id: "2026-10-16", label: "sex, 16/10", count: 0 },
      { id: "2026-10-20", label: "ter, 20/10", count: 1 },
    ]);
  });

  it("pedidos atrasados passam a valer no próximo dia de entrega", () => {
    const chips = dayChips(orders(makeDelivery({ id: "a", dueDate: "2026-10-09" })), new Date(2026, 9, 14, 8));
    expect(chips[0]).toEqual({ id: "2026-10-16", label: "sex, 16/10", count: 1 });
  });

  it("os concluídos vão para uma aba só, no fim, e não contam nos dias", () => {
    const chips = dayChips(
      orders(
        makeDelivery({ id: "a", mercado: "A", dueDate: "2026-10-13" }),
        makeDelivery({ id: "b", mercado: "B", dueDate: "2026-10-13", ...received }),
      ),
      today,
    );
    expect(chips).toEqual([
      { id: "2026-10-13", label: "Hoje, ter 13/10", count: 1 },
      { id: "2026-10-16", label: "sex, 16/10", count: 0 },
      { id: DONE_FILTER, label: "Concluídos", count: 1 },
    ]);
  });
});

describe("filterOrders", () => {
  const list = orders(
    makeDelivery({ id: "z", mercado: "Zé Hortifruti", dueDate: "2026-10-13" }),
    makeDelivery({ id: "a", mercado: "Ana Mercado", dueDate: "2026-10-13" }),
    makeDelivery({ id: "late", mercado: "Mercado Atrasado", dueDate: "2026-10-09" }),
    makeDelivery({ id: "sex", mercado: "Mercado Sexta", dueDate: "2026-10-16" }),
    makeDelivery({ id: "done", mercado: "Mercado Pronto", dueDate: "2026-10-13", ...received }),
  );
  const markets = (filter: string) => filterOrders(list, filter, today).map((order) => order.mercado);

  it("um dia: os atrasados primeiro, depois pelo nome do mercado", () => {
    expect(markets("2026-10-13")).toEqual(["Mercado Atrasado", "Ana Mercado", "Zé Hortifruti"]);
  });

  it("outro dia mostra só os dele", () => {
    expect(markets("2026-10-16")).toEqual(["Mercado Sexta"]);
  });

  it("concluídos", () => {
    expect(markets(DONE_FILTER)).toEqual(["Mercado Pronto"]);
  });
});

describe("buildPickList (o que separar)", () => {
  it("junta os pedidos do mesmo produto e soma os quilos", () => {
    const items = buildPickList([
      makeDelivery({ id: "a", produto: "Tomate", unidade: "Caixas", quantidade: 40 }),
      makeDelivery({ id: "b", produto: "tomate", unidade: "Caixas", quantidade: 10 }),
      makeDelivery({ id: "c", produto: "Alface", unidade: "Maços", quantidade: 30 }),
    ]);
    expect(items.map((item) => item.produto)).toEqual(["Alface", "Tomate"]);
    const tomate = items[1];
    expect(tomate.orders).toBe(2);
    expect(tomate.expectedKg).toBe(1000);
    expect(tomate.units).toEqual([{ unidade: "Caixas", quantidade: 50 }]);
  });

  it("unidades diferentes do mesmo produto ficam lado a lado", () => {
    const [item] = buildPickList([
      makeDelivery({ id: "a", unidade: "Caixas", quantidade: 2 }),
      makeDelivery({ id: "b", unidade: "Kg", quantidade: 5 }),
    ]);
    expect(item.units).toEqual([
      { unidade: "Caixas", quantidade: 2 },
      { unidade: "Kg", quantidade: 5 },
    ]);
    expect(item.expectedKg).toBe(45);
  });

  it("mostra quanto já foi pesado e quanto falta", () => {
    const [item] = buildPickList([
      makeDelivery({ id: "a", weighings: [weighing(4)] }),
      makeDelivery({ id: "b", weighings: [weighing(10, "x")] }),
    ]);
    expect(item.weighedKg).toBe(14);
    expect(item.remainingKg).toBe(6);
    expect(item.percent).toBe(70);
  });

  it("o que já foi entregue à logística ou recebido não precisa mais ser separado", () => {
    const items = buildPickList([
      makeDelivery({ id: "a", produto: "Tomate" }),
      makeDelivery({ id: "b", produto: "Alface", ...handedOver }),
      makeDelivery({ id: "c", produto: "Banana", ...received }),
    ]);
    expect(items.map((item) => item.produto)).toEqual(["Tomate"]);
  });

  it("lista vazia", () => {
    expect(buildPickList([])).toEqual([]);
  });
});

describe("pendingCount (pedidos que pedem ação até o próximo dia de entrega)", () => {
  it("conta os pedidos do próximo dia de entrega ou atrasados que o produtor ainda não entregou", () => {
    const list = orders(
      makeDelivery({ id: "a", mercado: "A", dueDate: "2026-10-13" }),
      makeDelivery({ id: "a2", mercado: "A", produto: "Outro", dueDate: "2026-10-13" }),
      makeDelivery({ id: "b", mercado: "B", dueDate: "2026-10-09" }),
      makeDelivery({ id: "c", mercado: "C", dueDate: "2026-10-16" }),
      makeDelivery({ id: "d", mercado: "D", dueDate: "2026-10-13", ...handedOver }),
    );
    expect(pendingCount(list, today)).toBe(2);
  });

  it("numa quarta, o próximo dia de entrega é a sexta", () => {
    const list = orders(
      makeDelivery({ id: "a", mercado: "A", dueDate: "2026-10-16" }),
      makeDelivery({ id: "b", mercado: "B", dueDate: "2026-10-20" }),
    );
    expect(pendingCount(list, new Date(2026, 9, 14, 8))).toBe(1);
  });

  it("zero sem pedidos", () => {
    expect(pendingCount([], today)).toBe(0);
  });
});
