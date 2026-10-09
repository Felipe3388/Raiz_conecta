import { makeDelivery, weighing } from "./fixtures";
import { buildPickList, dayChips, DONE_FILTER, filterDeliveries, isLate, pendingCount } from "./plan";

const today = new Date(2026, 9, 8, 9, 30);
const handedOver = { handedOverAt: "2026-10-08T12:00:00.000Z" };
const received = { ...handedOver, receipt: { kg: 10, source: "BALANCA" as const, at: "x" } };

describe("isLate", () => {
  it("atrasada: o dia passou e o produtor ainda não entregou", () => {
    expect(isLate(makeDelivery({ dueDate: "2026-10-07" }), today)).toBe(true);
    expect(isLate(makeDelivery({ dueDate: "2026-10-07", weighings: [weighing(10)] }), today)).toBe(true);
  });

  it("hoje e o futuro não estão atrasados", () => {
    expect(isLate(makeDelivery({ dueDate: "2026-10-08" }), today)).toBe(false);
    expect(isLate(makeDelivery({ dueDate: "2026-10-09" }), today)).toBe(false);
  });

  it("quem já entregou à logística não está atrasado", () => {
    expect(isLate(makeDelivery({ dueDate: "2026-10-07", ...handedOver }), today)).toBe(false);
  });
});

describe("dayChips (as abas de dia)", () => {
  it("sempre tem Hoje e Amanhã, mesmo vazios", () => {
    expect(dayChips([], today)).toEqual([
      { id: "2026-10-08", label: "Hoje", count: 0 },
      { id: "2026-10-09", label: "Amanhã", count: 0 },
    ]);
  });

  it("conta as entregas de cada dia e acrescenta dias futuros que têm entrega", () => {
    const chips = dayChips(
      [
        makeDelivery({ id: "a", dueDate: "2026-10-08" }),
        makeDelivery({ id: "b", dueDate: "2026-10-08" }),
        makeDelivery({ id: "c", dueDate: "2026-10-12" }),
      ],
      today,
    );
    expect(chips).toEqual([
      { id: "2026-10-08", label: "Hoje", count: 2 },
      { id: "2026-10-09", label: "Amanhã", count: 0 },
      { id: "2026-10-12", label: "seg, 12/10", count: 1 },
    ]);
  });

  it("entregas atrasadas ou já com a logística de dias passados ficam em Hoje", () => {
    const chips = dayChips(
      [
        makeDelivery({ id: "a", dueDate: "2026-10-06" }),
        makeDelivery({ id: "b", dueDate: "2026-10-07", ...handedOver }),
      ],
      today,
    );
    expect(chips[0]).toEqual({ id: "2026-10-08", label: "Hoje", count: 2 });
  });

  it("as concluídas vão para uma aba só, no fim, e não contam nos dias", () => {
    const chips = dayChips(
      [makeDelivery({ id: "a", dueDate: "2026-10-08" }), makeDelivery({ id: "b", dueDate: "2026-10-08", ...received })],
      today,
    );
    expect(chips).toEqual([
      { id: "2026-10-08", label: "Hoje", count: 1 },
      { id: "2026-10-09", label: "Amanhã", count: 0 },
      { id: DONE_FILTER, label: "Concluídas", count: 1 },
    ]);
  });
});

describe("filterDeliveries", () => {
  const list = [
    makeDelivery({ id: "tomate", produto: "Tomate", dueDate: "2026-10-08" }),
    makeDelivery({ id: "alface", produto: "Alface", dueDate: "2026-10-08" }),
    makeDelivery({ id: "atrasada", produto: "Cenoura", dueDate: "2026-10-05" }),
    makeDelivery({ id: "amanha", produto: "Banana", dueDate: "2026-10-09" }),
    makeDelivery({ id: "pronto", produto: "Abóbora", dueDate: "2026-10-08", ...received }),
  ];

  it("um dia: as atrasadas primeiro, depois por nome do produto", () => {
    expect(filterDeliveries(list, "2026-10-08", today).map((d) => d.id)).toEqual(["atrasada", "alface", "tomate"]);
  });

  it("outro dia mostra só as dele", () => {
    expect(filterDeliveries(list, "2026-10-09", today).map((d) => d.id)).toEqual(["amanha"]);
  });

  it("concluídas", () => {
    expect(filterDeliveries(list, DONE_FILTER, today).map((d) => d.id)).toEqual(["pronto"]);
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

describe("pendingCount (entregas que pedem ação hoje)", () => {
  it("conta o que é de hoje ou está atrasado e o produtor ainda não entregou", () => {
    const list = [
      makeDelivery({ id: "a", dueDate: "2026-10-08" }),
      makeDelivery({ id: "b", dueDate: "2026-10-06" }),
      makeDelivery({ id: "c", dueDate: "2026-10-09" }),
      makeDelivery({ id: "d", dueDate: "2026-10-08", ...handedOver }),
      makeDelivery({ id: "e", dueDate: "2026-10-08", weighings: [weighing(10)] }),
    ];
    expect(pendingCount(list, today)).toBe(3);
  });

  it("zero sem entregas", () => {
    expect(pendingCount([], today)).toBe(0);
  });
});
