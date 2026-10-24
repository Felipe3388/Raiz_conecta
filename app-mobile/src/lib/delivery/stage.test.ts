import { makeDelivery, weighing } from "./fixtures";
import {
  availableActions,
  progressPercent,
  receiptJudgement,
  remainingKg,
  stageOf,
  totalWeighedKg,
  weighingJudgement,
} from "./stage";

const handedOver = { handedOverAt: "2026-10-08T12:00:00.000Z" };

describe("totalWeighedKg (as pesagens se somam)", () => {
  it("sem pesagem, zero", () => {
    expect(totalWeighedKg(makeDelivery())).toBe(0);
  });

  it("soma vários lotes sem erro de decimais", () => {
    expect(totalWeighedKg(makeDelivery({ weighings: [weighing(0.1), weighing(0.2, "b")] }))).toBe(0.3);
    expect(totalWeighedKg(makeDelivery({ weighings: [weighing(4.5), weighing(5.38, "b")] }))).toBe(9.88);
  });
});

describe("stageOf (em que etapa está a entrega)", () => {
  it("começa a separar", () => {
    expect(stageOf(makeDelivery())).toBe("A_SEPARAR");
  });

  it("pesou pouco: continua a separar", () => {
    expect(stageOf(makeDelivery({ weighings: [weighing(4)] }))).toBe("A_SEPARAR");
  });

  it("pesou o suficiente (dentro da faixa): pronta", () => {
    expect(stageOf(makeDelivery({ weighings: [weighing(9.88)] }))).toBe("PRONTA");
    expect(stageOf(makeDelivery({ weighings: [weighing(5), weighing(5, "b")] }))).toBe("PRONTA");
    expect(stageOf(makeDelivery({ weighings: [weighing(10.2)] }))).toBe("PRONTA");
  });

  it("passou do máximo do pedido: não fica pronta", () => {
    expect(stageOf(makeDelivery({ weighings: [weighing(12)] }))).toBe("A_SEPARAR");
  });

  it("abaixo do mínimo: continua a separar", () => {
    expect(stageOf(makeDelivery({ weighings: [weighing(9.7)] }))).toBe("A_SEPARAR");
  });

  it("entregou à logística", () => {
    expect(stageOf(makeDelivery({ ...handedOver, weighings: [weighing(10)] }))).toBe("COM_LOGISTICA");
  });

  it("o mercado pesou dentro da faixa: recebida", () => {
    const receipt = { kg: 9.9, source: "BALANCA" as const, at: "2026-10-08T15:00:00.000Z" };
    expect(stageOf(makeDelivery({ ...handedOver, receipt }))).toBe("RECEBIDA");
  });

  it("o mercado pesou fora da faixa: divergente", () => {
    const low = { kg: 8, source: "BALANCA" as const, at: "2026-10-08T15:00:00.000Z" };
    const high = { kg: 12, source: "DIGITADO" as const, at: "2026-10-08T15:00:00.000Z" };
    expect(stageOf(makeDelivery({ ...handedOver, receipt: low }))).toBe("DIVERGENTE");
    expect(stageOf(makeDelivery({ ...handedOver, receipt: high }))).toBe("DIVERGENTE");
  });
});

describe("weighingJudgement e receiptJudgement", () => {
  it("julgam o total do produtor e a pesagem do mercado contra o mesmo esperado", () => {
    const delivery = makeDelivery({
      weighings: [weighing(9)],
      receipt: { kg: 10.1, source: "BALANCA", at: "x" },
    });
    expect(weighingJudgement(delivery).verdict).toBe("ABAIXO");
    expect(receiptJudgement(delivery)?.verdict).toBe("NA_FAIXA");
  });

  it("sem recebimento não há julgamento", () => {
    expect(receiptJudgement(makeDelivery())).toBeNull();
  });

  it("40 kg esperam 40 kg, com faixa de 39,2 a 40,8", () => {
    const delivery = makeDelivery({ quantidade: 40, weighings: [weighing(39.5)] });
    expect(weighingJudgement(delivery).verdict).toBe("NA_FAIXA");
    expect(weighingJudgement(delivery).range).toEqual({ minKg: 39.2, maxKg: 40.8 });
  });
});

describe("remainingKg e progressPercent", () => {
  it("quanto falta para o peso esperado", () => {
    expect(remainingKg(makeDelivery({ weighings: [weighing(4)] }))).toBe(6);
  });

  it("não fica negativo quando passa", () => {
    expect(remainingKg(makeDelivery({ weighings: [weighing(12)] }))).toBe(0);
  });

  it("progresso em %, no máximo 100", () => {
    expect(progressPercent(makeDelivery())).toBe(0);
    expect(progressPercent(makeDelivery({ weighings: [weighing(5)] }))).toBe(50);
    expect(progressPercent(makeDelivery({ weighings: [weighing(15)] }))).toBe(100);
  });
});

describe("availableActions (o que o produtor pode fazer agora)", () => {
  it("a separar sem pesagem: só pesar", () => {
    expect(availableActions(makeDelivery())).toEqual(["WEIGH"]);
  });

  it("a separar com pesagem fora da faixa: pesar e entregar assim mesmo", () => {
    expect(availableActions(makeDelivery({ weighings: [weighing(4)] }))).toEqual(["WEIGH", "HAND_OVER"]);
  });

  it("pronta: pesar de novo ou entregar", () => {
    expect(availableActions(makeDelivery({ weighings: [weighing(10)] }))).toEqual(["WEIGH", "HAND_OVER"]);
  });

  it("com a logística: só o mercado confere", () => {
    expect(availableActions(makeDelivery({ ...handedOver, weighings: [weighing(10)] }))).toEqual(["RECEIVE"]);
  });

  it("recebida ou divergente: nada mais a fazer", () => {
    const receipt = { kg: 10, source: "BALANCA" as const, at: "x" };
    expect(availableActions(makeDelivery({ ...handedOver, receipt }))).toEqual([]);
    expect(availableActions(makeDelivery({ ...handedOver, receipt: { ...receipt, kg: 5 } }))).toEqual([]);
  });
});
