import { describeDelivery } from "@/lib/delivery/card";
import { makeDelivery, weighing } from "@/lib/delivery/fixtures";
import { DEFAULT_TOLERANCE, judgeWeight } from "@/lib/delivery/weight";
import { DELIVERY_STAGES } from "@/lib/delivery/stage";
import { describeOrder } from "@/lib/delivery/orderCard";
import { groupOrders } from "@/lib/delivery/orders";
import {
  itemStatus,
  minimumAlert,
  orderHandOverText,
  pickListTitle,
  producerVerdictSummary,
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
  it("hoje em minúscula, outros dias com a data", () => {
    expect(pickListTitle("Hoje, ter 13/10")).toBe("Separar hoje");
    expect(pickListTitle("sex, 16/10")).toBe("Separar para sex, 16/10");
  });
});

describe("verdictSummary", () => {
  const judge = (kg: number | null) => verdictSummary(judgeWeight(10, kg, DEFAULT_TOLERANCE));

  it("diz quanto falta para entrar na faixa", () => {
    expect(judge(9.3)).toBe("Faltam 0,5 kg para entrar na faixa");
  });

  it("diz quanto passou do limite", () => {
    expect(judge(12.5)).toBe("Passou 2,3 kg do limite");
  });

  it("dentro da faixa e sem peso", () => {
    expect(judge(10)).toBe("Dentro da faixa");
    expect(judge(null)).toBe("Nada pesado ainda");
  });
});

const today = new Date(2026, 9, 13);
const orderOf = (...deliveries: Parameters<typeof groupOrders>[0]) => describeOrder(groupOrders(deliveries)[0], today);

describe("orderHandOverText", () => {
  it("tudo na faixa: pergunta simples, com o mercado e o peso total", () => {
    const text = orderHandOverText(
      orderOf(
        makeDelivery({ id: "a", weighings: [weighing(9.88)] }),
        makeDelivery({ id: "b", produto: "Outro", weighings: [weighing(10, "x")] }),
      ),
    );

    expect(text).toMatchObject({ title: "Entregar à logística?", warning: false });
    expect(text.description).toContain("Mercado Teste");
    expect(text.description).toContain("2 produtos");
    expect(text.description).toContain("19,88 kg");
  });

  it("peso fora da faixa: cita os produtos e avisa que o mercado será avisado", () => {
    const text = orderHandOverText(
      orderOf(
        makeDelivery({ id: "a", weighings: [weighing(10)] }),
        makeDelivery({ id: "b", produto: "Morango", weighings: [weighing(6, "x")] }),
      ),
    );

    expect(text.warning).toBe(true);
    expect(text.description).toContain("Morango");
    expect(text.description).toContain("mercado será avisado");
  });
});

describe("itemStatus", () => {
  const card = (overrides: Parameters<typeof makeDelivery>[0] = {}) => describeDelivery(makeDelivery(overrides), today);

  it("sem peso: a pesar", () => {
    expect(itemStatus(card())).toEqual({ label: "A pesar", tone: "neutral" });
  });

  it("pesado: o peso, em verde na faixa e em âmbar abaixo dela", () => {
    expect(itemStatus(card({ weighings: [weighing(10)] }))).toEqual({ label: "10 kg", tone: "success" });
    expect(itemStatus(card({ weighings: [weighing(6)] }))).toEqual({ label: "6 kg", tone: "warning" });
  });

  it("entregue à logística e depois recebido", () => {
    const handed = { weighings: [weighing(10)], handedOverAt: "2026-10-13T12:00:00.000Z" };
    expect(itemStatus(card(handed))).toEqual({ label: "Entregue · 10 kg", tone: "info" });
    expect(itemStatus(card({ ...handed, receipt: { kg: 9.9, source: "BALANCA", at: "x" } }))).toEqual({
      label: "Mercado: 9,9 kg",
      tone: "success",
    });
  });
});

describe("peso do produtor (mínimo e máximo)", () => {
  const judge = (kg: number | null) => judgeWeight(10, kg, DEFAULT_TOLERANCE);

  it("diz quanto falta para o mínimo", () => {
    expect(producerVerdictSummary(judge(9.3))).toBe("Faltam 0,5 kg para o mínimo");
  });

  it("dentro da faixa: dentro da faixa; passou do máximo diz quanto", () => {
    expect(producerVerdictSummary(judge(9.8))).toBe("Dentro da faixa");
    expect(producerVerdictSummary(judge(10))).toBe("Dentro da faixa");
    expect(producerVerdictSummary(judge(12))).toBe("1,8 kg acima do máximo");
  });

  it("o aviso de abaixo do mínimo diz o produto, quanto falta e o mínimo", () => {
    const alert = minimumAlert("Alface", judge(9));
    expect(alert.title).toBe("Abaixo do mínimo");
    expect(alert.message).toBe("Alface: faltam 0,8 kg para o mínimo de 9,8 kg.");
    expect(alert.button).toBe("Entendi");
  });
});
