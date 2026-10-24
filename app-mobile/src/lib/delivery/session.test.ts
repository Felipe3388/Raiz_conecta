import { describeOrder } from "./orderCard";
import { groupOrders } from "./orders";
import {
  advanceRun,
  backRun,
  betweenInfo,
  buildRunSteps,
  celebrationKind,
  celebrationNext,
  CELEBRATION_MS,
  CELEBRATION_SWAP_MS,
  runPosition,
  shouldAutoRegister,
  skipNextOrder,
  startRun,
  type RunPhase,
  type RunState,
  type RunStep,
} from "./session";
import type { Delivery } from "@/types/delivery";

const TODAY = new Date("2026-10-13T12:00:00");

function delivery(id: string, mercado: string, produto: string, overrides: Partial<Delivery> = {}): Delivery {
  return {
    id,
    propostaId: `p-${mercado}`,
    mercado,
    produto,
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

const cardsOf = (deliveries: Delivery[]) => groupOrders(deliveries).map((order) => describeOrder(order, TODAY));
const step = (orderKey: string, itemId: string): RunStep => ({ orderKey, mercado: orderKey, itemId, produto: itemId });

describe("buildRunSteps", () => {
  it("lista cada produto, pedido por pedido", () => {
    const steps = buildRunSteps(
      cardsOf([
        delivery("1", "Empório", "Abacaxi"),
        delivery("2", "Empório", "Alface"),
        delivery("3", "Teste", "Tomate"),
      ]),
    );
    expect(steps.map((entry) => [entry.mercado, entry.produto])).toEqual([
      ["Empório", "Abacaxi"],
      ["Empório", "Alface"],
      ["Teste", "Tomate"],
    ]);
  });

  it("deixa de fora o produto que já está na faixa e o pedido que já saiu do produtor", () => {
    const steps = buildRunSteps(
      cardsOf([
        delivery("1", "Empório", "Abacaxi", { weighings: [{ id: "w", kg: 10, source: "BALANCA", at: "x" }] }),
        delivery("2", "Empório", "Alface"),
        delivery("3", "Teste", "Tomate", {
          weighings: [{ id: "w", kg: 10, source: "BALANCA", at: "x" }],
          handedOverAt: "2026-10-13T10:00:00",
        }),
      ]),
    );
    expect(steps.map((entry) => entry.itemId)).toEqual(["2"]);
  });

  it("sem nada para pesar, não há passos nem sessão", () => {
    expect(buildRunSteps([])).toEqual([]);
    expect(startRun([])).toBeNull();
  });
});

describe("runPosition", () => {
  const steps = [step("A", "1"), step("A", "2"), step("B", "3")];

  it("diz o pedido, o produto e o passo da vez", () => {
    expect(runPosition(steps, 1)).toEqual({
      order: 1,
      orders: 2,
      item: 2,
      items: 2,
      step: 2,
      steps: 3,
      isFirstOfOrder: false,
      isLastOfOrder: true,
      isLast: false,
    });
  });

  it("o primeiro produto de um pedido novo", () => {
    expect(runPosition(steps, 2)).toMatchObject({ order: 2, item: 1, items: 1, isFirstOfOrder: true, isLast: true });
  });
});

describe("advanceRun", () => {
  const steps = [step("A", "1"), step("A", "2"), step("B", "3")];
  const run = (index: number, phase: RunPhase = "weigh") => ({ steps, index, phase, skipped: 0 });

  it("automático: segue produto a produto dentro do pedido", () => {
    expect(advanceRun(run(0), true)).toMatchObject({ index: 1, phase: "weigh" });
  });

  it("automático: ao fim de um pedido faz a pausa antes do próximo, sem sair do último produto", () => {
    expect(advanceRun(run(1), true)).toMatchObject({ index: 1, phase: "between" });
  });

  it("depois da pausa começa o primeiro produto do pedido seguinte", () => {
    expect(advanceRun(run(1, "between"), true)).toMatchObject({ index: 2, phase: "weigh" });
  });

  it("automático: acaba depois do último produto, sem pausa", () => {
    expect(advanceRun(run(2), true)).toBeNull();
  });

  it("manual: dentro do pedido segue de produto em produto", () => {
    expect(advanceRun(run(0), false)).toMatchObject({ index: 1, phase: "weigh" });
  });

  it("manual: ao fim do pedido pede a confirmação, depois a pausa, e só então vai ao próximo pedido", () => {
    const confirming = advanceRun(run(1), false);
    expect(confirming).toMatchObject({ index: 1, phase: "confirm" });
    const between = advanceRun(confirming!, false);
    expect(between).toMatchObject({ index: 1, phase: "between" });
    expect(advanceRun(between!, false)).toMatchObject({ index: 2, phase: "weigh" });
  });

  it("manual: o último pedido também pede confirmação e então acaba", () => {
    const confirming = advanceRun(run(2), false);
    expect(confirming).toMatchObject({ index: 2, phase: "confirm" });
    expect(advanceRun(confirming!, false)).toBeNull();
  });
});

describe("betweenInfo", () => {
  const steps = [step("A", "1"), step("B", "2"), step("B", "3")];

  it("diz o pedido que terminou, o que vem e quantos produtos ele tem", () => {
    expect(betweenInfo({ steps, index: 0, phase: "between", skipped: 0 })).toEqual({
      finishedMercado: "A",
      nextMercado: "B",
      nextItems: 2,
    });
  });

  it("fora da pausa não há nada a mostrar", () => {
    expect(betweenInfo({ steps, index: 0, phase: "weigh", skipped: 0 })).toBeNull();
  });
});

describe("skipNextOrder", () => {
  const steps = [step("A", "1"), step("B", "2"), step("B", "3"), step("C", "4")];

  it("tira o próximo pedido da sessão e fica na pausa para o seguinte", () => {
    const skipped = skipNextOrder({ steps, index: 0, phase: "between", skipped: 0 });
    expect(skipped.steps.map((entry) => entry.itemId)).toEqual(["1", "4"]);
    expect(skipped).toMatchObject({ index: 0, phase: "between", skipped: 1 });
    expect(betweenInfo(skipped)?.nextMercado).toBe("C");
  });

  it("se não sobra pedido depois do pulado, não há mais pausa: a sessão acabou", () => {
    const skipped = skipNextOrder({ steps, index: 2, phase: "between", skipped: 0 });
    expect(skipped.steps.map((entry) => entry.itemId)).toEqual(["1", "2", "3"]);
    expect(skipped.skipped).toBe(1);
    expect(betweenInfo(skipped)).toBeNull();
  });

  it("conta quantos pedidos ficaram para depois", () => {
    const first = skipNextOrder({ steps, index: 0, phase: "between", skipped: 0 });
    expect(skipNextOrder(first).skipped).toBe(2);
  });

  it("fora da pausa não muda nada", () => {
    const state = { steps, index: 0, phase: "weigh" as const, skipped: 0 };
    expect(skipNextOrder(state)).toBe(state);
  });
});

describe("backRun", () => {
  const steps = [step("A", "1"), step("A", "2"), step("B", "3")];

  it("da confirmação volta ao último produto do pedido", () => {
    expect(backRun({ steps, index: 1, phase: "confirm", skipped: 0 })).toMatchObject({ index: 1, phase: "weigh" });
  });

  it("volta ao produto anterior do mesmo pedido, e no primeiro fica onde está", () => {
    expect(backRun({ steps, index: 1, phase: "weigh", skipped: 0 }).index).toBe(0);
    expect(backRun({ steps, index: 0, phase: "weigh", skipped: 0 }).index).toBe(0);
  });

  it("não volta para o pedido que já terminou", () => {
    expect(backRun({ steps, index: 2, phase: "weigh", skipped: 0 }).index).toBe(2);
  });

  it("na pausa entre pedidos não há para onde voltar", () => {
    const between = { steps, index: 1, phase: "between" as const, skipped: 0 };
    expect(backRun(between)).toBe(between);
  });
});

describe("shouldAutoRegister", () => {
  const base = {
    autoWeigh: true,
    source: "BALANCA" as const,
    candidateKg: 10,
    verdict: "NA_FAIXA" as const,
    saving: false,
    held: true,
  };

  it("registra sozinho quando o peso parou e está na faixa", () => {
    expect(shouldAutoRegister(base)).toBe(true);
  });

  it.each([
    ["modo manual", { autoWeigh: false }],
    ["peso digitado", { source: "DIGITADO" as const }],
    ["o peso ainda oscila", { candidateKg: null }],
    ["abaixo da faixa", { verdict: "ABAIXO" as const }],
    ["acima da faixa", { verdict: "ACIMA" as const }],
    ["já está salvando", { saving: true }],
    ["o peso ainda não ficou estável pelo tempo todo", { held: false }],
  ])("não registra sozinho: %s", (_name, change) => {
    expect(shouldAutoRegister({ ...base, ...change })).toBe(false);
  });
});

describe("celebração ao passar de produto", () => {
  const steps = [step("A", "a1"), step("A", "a2"), step("B", "b1")];
  const at = (index: number, phase: RunPhase = "weigh"): RunState => ({ steps, index, phase, skipped: 0 });

  it("dura 3 segundos e troca o conteúdo no meio, escondida pela confirmação", () => {
    expect(CELEBRATION_MS).toBe(3000);
    expect(CELEBRATION_SWAP_MS).toBeGreaterThan(0);
    expect(CELEBRATION_SWAP_MS).toBeLessThan(CELEBRATION_MS);
  });

  it("no modo rápido, o produto do meio do pedido confirma o produto", () => {
    expect(celebrationKind(at(0), true)).toBe("item");
  });

  it("no modo rápido, o último produto do pedido confirma o pedido", () => {
    expect(celebrationKind(at(1), true)).toBe("order");
    expect(celebrationKind(at(2), true)).toBe("order");
  });

  it("no modo manual, o último produto confirma só o produto e quem fecha o pedido é a confirmação dele", () => {
    expect(celebrationKind(at(1), false)).toBe("item");
    expect(celebrationKind(at(1, "confirm"), false)).toBe("order");
  });

  it("na pausa entre pedidos não há confirmação", () => {
    expect(celebrationKind(at(1, "between"), true)).toBeNull();
  });

  it("diz o que vem em seguida: o próximo produto do pedido ou o primeiro do pedido seguinte", () => {
    expect(celebrationNext(at(0), "item")?.itemId).toBe("a2");
    expect(celebrationNext(at(1), "item")).toBeNull();
    expect(celebrationNext(at(1), "order")?.itemId).toBe("b1");
    expect(celebrationNext(at(2), "order")).toBeNull();
  });
});
