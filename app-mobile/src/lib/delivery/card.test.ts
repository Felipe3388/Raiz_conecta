import { describeDelivery } from "./card";
import { makeDelivery, weighing } from "./fixtures";

const today = new Date(2026, 9, 8, 9, 30);
const handedOver = { handedOverAt: "2026-10-08T12:00:00.000Z" };

describe("describeDelivery (tudo o que o cartão da entrega mostra)", () => {
  it("entrega nova: a separar, nada pesado", () => {
    const card = describeDelivery(makeDelivery(), today);

    expect(card).toMatchObject({
      stage: "A_SEPARAR",
      late: false,
      expectedKg: 10,
      weighedKg: 0,
      percent: 0,
      actions: ["WEIGH"],
      receipt: null,
    });
    expect(card.weighing.verdict).toBe("SEM_PESO");
  });

  it("o dia aparece como Hoje, Amanhã ou a data", () => {
    expect(describeDelivery(makeDelivery({ dueDate: "2026-10-08" }), today).dayLabel).toBe("Hoje");
    expect(describeDelivery(makeDelivery({ dueDate: "2026-10-09" }), today).dayLabel).toBe("Amanhã");
    expect(describeDelivery(makeDelivery({ dueDate: "2026-10-12" }), today).dayLabel).toBe("seg, 12/10");
  });

  it("pesada e dentro da faixa: pronta", () => {
    const card = describeDelivery(makeDelivery({ weighings: [weighing(9.88)] }), today);

    expect(card.stage).toBe("PRONTA");
    expect(card.weighedKg).toBe(9.88);
    expect(card.weighing.verdict).toBe("NA_FAIXA");
    expect(card.actions).toEqual(["WEIGH", "HAND_OVER"]);
  });

  it("atrasada", () => {
    expect(describeDelivery(makeDelivery({ dueDate: "2026-10-06" }), today).late).toBe(true);
  });

  it("o valor é a quantidade pedida vezes o preço", () => {
    const card = describeDelivery(makeDelivery({ unidade: "Caixas", quantidade: 40, preco: 47 }), today);

    expect(card.value).toBe(1880);
    expect(card.valueConfirmed).toBe(false);
  });

  it("depois que o mercado pesa, o valor passa a ser o do peso conferido", () => {
    const card = describeDelivery(
      makeDelivery({ ...handedOver, receipt: { kg: 9.9, source: "BALANCA", at: "x" } }),
      today,
    );

    expect(card.value).toBe(44.55);
    expect(card.valueConfirmed).toBe(true);
    expect(card.receipt?.verdict).toBe("NA_FAIXA");
  });

  it("peso do mercado fora da faixa: também vale o que foi medido", () => {
    const card = describeDelivery(
      makeDelivery({ ...handedOver, receipt: { kg: 9.5, source: "BALANCA", at: "x" } }),
      today,
    );

    expect(card.value).toBe(42.75);
    expect(card.stage).toBe("DIVERGENTE");
    expect(card.receipt?.verdict).toBe("ABAIXO");
  });

  it("entregue fora da faixa fica marcado", () => {
    const card = describeDelivery(
      makeDelivery({ ...handedOver, handedOverOutOfRange: true, weighings: [weighing(6)] }),
      today,
    );

    expect(card.stage).toBe("COM_LOGISTICA");
    expect(card.sentOutOfRange).toBe(true);
  });
});
