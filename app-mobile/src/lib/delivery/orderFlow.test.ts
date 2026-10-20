import { describeDelivery } from "./card";
import { makeDelivery, weighing } from "./fixtures";
import { firstItemToWeigh, nextItemToWeigh, previousItem } from "./orderFlow";

const today = new Date(2026, 9, 13, 9, 30);
const handedOver = { handedOverAt: "2026-10-13T12:00:00.000Z" };
const items = (...overrides: Parameters<typeof makeDelivery>[0][]) =>
  overrides.map((item, index) => describeDelivery(makeDelivery({ id: `i${index + 1}`, ...item }), today));

describe("pesagem do produtor, produto a produto", () => {
  it("começa no primeiro produto que ainda não está na faixa", () => {
    const list = items({ weighings: [weighing(10)] }, {}, {});
    expect(firstItemToWeigh(list, "PRODUTOR")).toBe("i2");
  });

  it("se todos já estão na faixa, volta ao primeiro para revisar", () => {
    const list = items({ weighings: [weighing(10)] }, { weighings: [weighing(10, "x")] });
    expect(firstItemToWeigh(list, "PRODUTOR")).toBe("i1");
  });

  it("um produto pesado fora da faixa ainda pede atenção", () => {
    const list = items({ weighings: [weighing(10)] }, { weighings: [weighing(5, "x")] });
    expect(firstItemToWeigh(list, "PRODUTOR")).toBe("i2");
  });

  it("o próximo é o seguinte da lista; depois do último, acabou", () => {
    const list = items({}, {}, {});
    expect(nextItemToWeigh(list, "i1", "PRODUTOR")).toBe("i2");
    expect(nextItemToWeigh(list, "i3", "PRODUTOR")).toBeNull();
  });

  it("dá para voltar ao anterior, e do primeiro não há anterior", () => {
    const list = items({}, {}, {});
    expect(previousItem(list, "i3")).toBe("i2");
    expect(previousItem(list, "i1")).toBeNull();
  });

  it("produto que não existe na lista não leva a lugar nenhum", () => {
    const list = items({}, {});
    expect(nextItemToWeigh(list, "nada", "PRODUTOR")).toBeNull();
    expect(previousItem(list, "nada")).toBeNull();
  });
});

describe("pesagem do mercado ao receber", () => {
  const received = { ...handedOver, receipt: { kg: 10, source: "BALANCA" as const, at: "x" } };

  it("começa no primeiro produto que o mercado ainda não pesou", () => {
    const list = items({ ...received }, { ...handedOver }, { ...handedOver });
    expect(firstItemToWeigh(list, "MERCADO")).toBe("i2");
  });

  it("depois de pesar um, vai ao próximo não pesado e, no fim, volta aos que sobraram", () => {
    const list = items({ ...handedOver }, { ...received }, { ...handedOver });
    expect(nextItemToWeigh(list, "i1", "MERCADO")).toBe("i3");
    expect(nextItemToWeigh(list, "i3", "MERCADO")).toBe("i1");
  });

  it("quando todos foram pesados, acabou", () => {
    const list = items({ ...received }, { ...received });
    expect(nextItemToWeigh(list, "i2", "MERCADO")).toBeNull();
  });
});
