import type { Demand } from "@/types/produtor";
import { MockDemandService } from "./MockDemandService";
import { MockDeliveryService } from "./MockDeliveryService";

const ME = "maria@sitio.com";
const NOW = new Date(2026, 9, 8, 9, 0);

function demand(overrides: Partial<Demand> = {}): Demand {
  return {
    id: "d1",
    produto: "Cenoura",
    quantidade: 100,
    unidade: "Kg",
    precoMedio: 4.5,
    status: "ABERTA",
    ofertas: [{ emailProdutor: ME, quantidade: 10 }],
    criadoEm: "2026-10-01T10:00:00.000Z",
    ...overrides,
  };
}

function setup(seed: Demand[] = [demand()], days: Record<string, number> = {}) {
  const demands = new MockDemandService({ seed: () => seed, latencyMs: 0 });
  const service = new MockDeliveryService({ demands, days, defaultDays: 2, now: () => NOW, latencyMs: 0 });
  return { service, demands };
}

describe("MockDeliveryService.listDeliveries", () => {
  it("cada oferta do produtor vira uma entrega", async () => {
    const { service } = setup([
      demand({ id: "a" }),
      demand({ id: "b", ofertas: [{ emailProdutor: "outro@x.com", quantidade: 5 }] }),
      demand({
        id: "c",
        produto: "Tomate",
        unidade: "Caixas",
        ofertas: [{ emailProdutor: ME, quantidade: 40, preco: 47 }],
      }),
    ]);

    const list = await service.listDeliveries(ME);

    expect(list.map((delivery) => delivery.id)).toEqual(["a", "c"]);
    expect(list[1]).toMatchObject({ produto: "Tomate", unidade: "Caixas", quantidade: 40, preco: 47 });
  });

  it("sem preço combinado, vale o preço médio do pedido", async () => {
    const [delivery] = await setup().service.listDeliveries(ME);

    expect(delivery.preco).toBe(4.5);
  });

  it("pedido cancelado não gera entrega", async () => {
    const { service } = setup([demand({ status: "CANCELADA" })]);

    expect(await service.listDeliveries(ME)).toEqual([]);
  });

  it("marca o dia: o da tabela, ou o padrão, e ele não muda depois", async () => {
    const { service } = setup([demand({ id: "a" }), demand({ id: "b" })], { a: 0 });

    const first = await service.listDeliveries(ME);
    const second = await service.listDeliveries(ME);

    expect(first.map((delivery) => delivery.dueDate)).toEqual(["2026-10-08", "2026-10-10"]);
    expect(second.map((delivery) => delivery.dueDate)).toEqual(["2026-10-08", "2026-10-10"]);
  });

  it("começa sem pesagem, sem entrega e sem recebimento", async () => {
    const [delivery] = await setup().service.listDeliveries(ME);

    expect(delivery).toMatchObject({ weighings: [], handedOverAt: null, handedOverOutOfRange: false, receipt: null });
  });

  it("uma oferta nova aparece na lista seguinte", async () => {
    const { service, demands } = setup([demand({ ofertas: [] })]);
    expect(await service.listDeliveries(ME)).toEqual([]);

    await demands.sendOffer({ demandaId: "d1", quantidade: 20, emailProdutor: ME });

    expect((await service.listDeliveries(ME)).map((delivery) => delivery.id)).toEqual(["d1"]);
  });
});

describe("MockDeliveryService.addWeighing", () => {
  it("guarda a pesagem e devolve a entrega atualizada", async () => {
    const { service } = setup();
    await service.listDeliveries(ME);

    const updated = await service.addWeighing(ME, "d1", { kg: 9.88, source: "BALANCA" });

    expect(updated.weighings).toHaveLength(1);
    expect(updated.weighings[0]).toMatchObject({ kg: 9.88, source: "BALANCA", at: NOW.toISOString() });
    expect((await service.listDeliveries(ME))[0].weighings).toHaveLength(1);
  });

  it("as pesagens se acumulam, cada uma com seu código", async () => {
    const { service } = setup();
    await service.listDeliveries(ME);

    await service.addWeighing(ME, "d1", { kg: 4, source: "BALANCA" });
    const updated = await service.addWeighing(ME, "d1", { kg: 5.5, source: "DIGITADO" });

    expect(updated.weighings.map((item) => item.kg)).toEqual([4, 5.5]);
    expect(new Set(updated.weighings.map((item) => item.id)).size).toBe(2);
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY, 10001])("recusa peso inválido (%p)", async (kg) => {
    const { service } = setup();
    await service.listDeliveries(ME);

    await expect(service.addWeighing(ME, "d1", { kg, source: "BALANCA" })).rejects.toThrow("peso válido");
  });

  it("recusa uma entrega que não existe", async () => {
    const { service } = setup();
    await service.listDeliveries(ME);

    await expect(service.addWeighing(ME, "nada", { kg: 5, source: "BALANCA" })).rejects.toThrow("não encontrada");
  });

  it("não deixa pesar depois de entregar à logística", async () => {
    const { service } = setup();
    await service.listDeliveries(ME);
    await service.addWeighing(ME, "d1", { kg: 10, source: "BALANCA" });
    await service.handOver(ME, "d1");

    await expect(service.addWeighing(ME, "d1", { kg: 1, source: "BALANCA" })).rejects.toThrow(
      "já foi para a logística",
    );
  });
});

describe("MockDeliveryService.removeWeighing", () => {
  it("apaga só a pesagem escolhida", async () => {
    const { service } = setup();
    await service.listDeliveries(ME);
    await service.addWeighing(ME, "d1", { kg: 4, source: "BALANCA" });
    const withTwo = await service.addWeighing(ME, "d1", { kg: 5, source: "BALANCA" });

    const updated = await service.removeWeighing(ME, "d1", withTwo.weighings[0].id);

    expect(updated.weighings.map((item) => item.kg)).toEqual([5]);
  });

  it("pesagem que não existe", async () => {
    const { service } = setup();
    await service.listDeliveries(ME);

    await expect(service.removeWeighing(ME, "d1", "x")).rejects.toThrow("Pesagem não encontrada");
  });
});

describe("MockDeliveryService.handOver", () => {
  it("sem pesagem não entrega", async () => {
    const { service } = setup();
    await service.listDeliveries(ME);

    await expect(service.handOver(ME, "d1")).rejects.toThrow("Pese o produto");
  });

  it("peso dentro da faixa: entrega normal", async () => {
    const { service } = setup();
    await service.listDeliveries(ME);
    await service.addWeighing(ME, "d1", { kg: 9.88, source: "BALANCA" });

    const updated = await service.handOver(ME, "d1");

    expect(updated.handedOverAt).toBe(NOW.toISOString());
    expect(updated.handedOverOutOfRange).toBe(false);
  });

  it("peso fora da faixa: entrega, mas fica registrado que estava fora", async () => {
    const { service } = setup();
    await service.listDeliveries(ME);
    await service.addWeighing(ME, "d1", { kg: 6, source: "DIGITADO" });

    const updated = await service.handOver(ME, "d1");

    expect(updated.handedOverOutOfRange).toBe(true);
  });

  it("não entrega duas vezes", async () => {
    const { service } = setup();
    await service.listDeliveries(ME);
    await service.addWeighing(ME, "d1", { kg: 10, source: "BALANCA" });
    await service.handOver(ME, "d1");

    await expect(service.handOver(ME, "d1")).rejects.toThrow("já foi para a logística");
  });
});

describe("MockDeliveryService.simulateReceipt", () => {
  async function handedOver() {
    const { service } = setup();
    await service.listDeliveries(ME);
    await service.addWeighing(ME, "d1", { kg: 10, source: "BALANCA" });
    await service.handOver(ME, "d1");
    return service;
  }

  it("guarda a pesagem do mercado", async () => {
    const service = await handedOver();

    const updated = await service.simulateReceipt(ME, "d1", { kg: 9.9, source: "BALANCA" });

    expect(updated.receipt).toEqual({ kg: 9.9, source: "BALANCA", at: NOW.toISOString() });
  });

  it("só depois de a logística levar", async () => {
    const { service } = setup();
    await service.listDeliveries(ME);

    await expect(service.simulateReceipt(ME, "d1", { kg: 9, source: "BALANCA" })).rejects.toThrow("logística");
  });

  it("o mercado pesa uma vez só", async () => {
    const service = await handedOver();
    await service.simulateReceipt(ME, "d1", { kg: 9.9, source: "BALANCA" });

    await expect(service.simulateReceipt(ME, "d1", { kg: 9, source: "BALANCA" })).rejects.toThrow("já pesou");
  });

  it("recusa peso inválido", async () => {
    const service = await handedOver();

    await expect(service.simulateReceipt(ME, "d1", { kg: 0, source: "BALANCA" })).rejects.toThrow("peso válido");
  });
});

describe("isolamento", () => {
  it("o andamento de uma pessoa não aparece para outra", async () => {
    const { service } = setup([
      demand({
        ofertas: [
          { emailProdutor: ME, quantidade: 10 },
          { emailProdutor: "joao@x.com", quantidade: 10 },
        ],
      }),
    ]);
    await service.listDeliveries(ME);
    await service.listDeliveries("joao@x.com");
    await service.addWeighing(ME, "d1", { kg: 10, source: "BALANCA" });

    expect((await service.listDeliveries("joao@x.com"))[0].weighings).toEqual([]);
  });

  it("o que é devolvido é uma cópia: mexer nele não muda a base", async () => {
    const { service } = setup();
    const [delivery] = await service.listDeliveries(ME);
    delivery.weighings.push({ id: "x", kg: 99, source: "BALANCA", at: "" });

    expect((await service.listDeliveries(ME))[0].weighings).toEqual([]);
  });
});
