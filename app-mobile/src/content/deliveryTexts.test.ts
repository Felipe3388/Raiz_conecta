import { describeDelivery } from "@/lib/delivery/card";
import { makeDelivery, weighing } from "@/lib/delivery/fixtures";
import { DEFAULT_TOLERANCE, judgeWeight } from "@/lib/delivery/weight";
import { DELIVERY_STAGES } from "@/lib/delivery/stage";
import {
  handOverText,
  pickListTitle,
  SCALE_TEXTS,
  STAGE_INFO,
  VERDICT_LABELS,
  VERDICT_TONES,
  verdictSummary,
} from "./deliveryTexts";

describe("textos de entrega", () => {
  it("tem texto para cada etapa", () => {
    expect(Object.keys(STAGE_INFO).sort()).toEqual([...DELIVERY_STAGES].sort());
    for (const info of Object.values(STAGE_INFO)) {
      expect(info.label).not.toBe("");
      expect(info.hint).not.toBe("");
    }
  });

  it("tem texto e cor para cada resultado da pesagem", () => {
    expect(Object.keys(VERDICT_LABELS).sort()).toEqual(["ABAIXO", "ACIMA", "NA_FAIXA", "SEM_PESO"]);
    expect(Object.keys(VERDICT_TONES).sort()).toEqual(Object.keys(VERDICT_LABELS).sort());
  });

  it("a divergência é a única etapa em vermelho", () => {
    const danger = Object.entries(STAGE_INFO).filter(([, info]) => info.tone === "danger");
    expect(danger.map(([stage]) => stage)).toEqual(["DIVERGENTE"]);
  });

  it("explica cada situação da balança", () => {
    expect(Object.keys(SCALE_TEXTS).sort()).toEqual(["connecting", "empty", "locked", "lost", "settling", "stable"]);
  });
});

describe("pickListTitle", () => {
  it("hoje e amanhã em minúscula, outros dias com a data", () => {
    expect(pickListTitle("Hoje")).toBe("Separar hoje");
    expect(pickListTitle("Amanhã")).toBe("Separar amanhã");
    expect(pickListTitle("seg, 12/10")).toBe("Separar para seg, 12/10");
  });
});

describe("verdictSummary", () => {
  const judge = (kg: number | null) => verdictSummary(judgeWeight(10, kg, DEFAULT_TOLERANCE));

  it("diz quanto falta para entrar na faixa", () => {
    expect(judge(9.3)).toBe("Faltam 0,5 kg para entrar na faixa");
  });

  it("diz quanto passou do limite", () => {
    expect(judge(12.5)).toBe("Passou 1,5 kg do limite");
  });

  it("dentro da faixa e sem peso", () => {
    expect(judge(10)).toBe("Dentro da faixa");
    expect(judge(null)).toBe("Nada pesado ainda");
  });
});

describe("handOverText", () => {
  const today = new Date(2026, 9, 8);

  it("peso certo: pergunta simples", () => {
    const card = describeDelivery(makeDelivery({ weighings: [weighing(9.88)] }), today);

    expect(handOverText(card)).toMatchObject({ title: "Entregar à logística?", warning: false });
    expect(handOverText(card).description).toContain("9,88 kg");
  });

  it("peso fora da faixa: avisa a faixa e que o mercado será avisado", () => {
    const card = describeDelivery(makeDelivery({ weighings: [weighing(6)] }), today);
    const text = handOverText(card);

    expect(text.warning).toBe(true);
    expect(text.description).toContain("9,8 kg a 11 kg");
    expect(text.description).toContain("mercado será avisado");
  });
});
