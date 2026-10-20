import type { Proposal } from "@/types/proposal";
import { MockDeliveryService } from "./MockDeliveryService";
import { MockProposalService } from "./MockProposalService";

const ME = "maria@sitio.com";
const NOW = new Date(2026, 9, 13, 9, 0);

interface Line {
  produto?: string;
  unidade?: string;
  quantidade?: number;
  preco?: number;
  aceita?: number | null;
}

// Um pedido aceito com um produto (o código do produto é o mesmo do pedido). Por padrão o produtor aceitou tudo o que foi oferecido.
function proposal(overrides: Partial<Proposal> & Line = {}): Proposal {
  const { produto = "Cenoura", unidade = "Kg", quantidade = 10, preco = 4.5, aceita, ...order } = overrides;
  const id = order.id ?? "d1";
  return {
    id,
    numero: 1,
    mercado: "Mercado Teste",
    itens: [{ id, produto, quantidade, unidade, preco, aceita: aceita ?? quantidade }],
    entrega: "2026-10-16",
    status: "ACEITA",
    recebidaEm: "2026-10-13T08:00:00.000Z",
    expiraEm: "2026-10-13T08:30:00.000Z",
    respondidaEm: "2026-10-13T08:05:00.000Z",
    ...order,
  };
}

function setup(seed: Proposal[] = [proposal()]) {
  const proposals = new MockProposalService({ seed: () => seed, now: () => NOW, latencyMs: 0 });
  const service = new MockDeliveryService({ proposals, now: () => NOW, latencyMs: 0 });
  return { service, proposals };
}

describe("MockDeliveryService.listDeliveries", () => {
  it("cada produto aceito vira uma entrega, com o mercado, o preço fixo e o dia marcado", async () => {
    const { service } = setup([
      proposal({ id: "a" }),
      proposal({ id: "b", status: "RECUSADA" }),
      proposal({ id: "c", status: "PENDENTE" }),
      proposal({ id: "d", produto: "Tomate", unidade: "Caixas", quantidade: 40, preco: 36, mercado: "Empório" }),
    ]);

    const list = await service.listDeliveries(ME);

    expect(list.map((delivery) => delivery.id)).toEqual(["a", "d"]);
    expect(list[0]).toMatchObject({ propostaId: "a", mercado: "Mercado Teste", preco: 4.5, dueDate: "2026-10-16" });
    expect(list[1]).toMatchObject({
      produto: "Tomate",
      unidade: "Caixas",
      quantidade: 40,
      preco: 36,
      mercado: "Empório",
    });
  });

  it("um pedido com vários produtos gera uma entrega por produto, com a quantidade aceita; o que ficou de fora não entra", async () => {
    const order = proposal({ id: "o1", produto: "Morango", quantidade: 30 });
    order.itens.push(
      { id: "o1-b", produto: "Alface", quantidade: 30, unidade: "Kg", preco: 2, aceita: 20 },
      { id: "o1-c", produto: "Abacaxi", quantidade: 40, unidade: "Kg", preco: 4, aceita: 0 },
    );
    const { service } = setup([order]);

    const list = await service.listDeliveries(ME);

    expect(list.map((delivery) => [delivery.id, delivery.propostaId, delivery.produto, delivery.quantidade])).toEqual([
      ["o1", "o1", "Morango", 30],
      ["o1-b", "o1", "Alface", 20],
    ]);
  });

  it("o dia da entrega é o da proposta e não muda entre uma listagem e outra", async () => {
    const { service } = setup([
      proposal({ id: "a", entrega: "2026-10-13" }),
      proposal({ id: "b", entrega: "2026-10-20" }),
    ]);

    const first = await service.listDeliveries(ME);
    const second = await service.listDeliveries(ME);

    expect(first.map((delivery) => delivery.dueDate)).toEqual(["2026-10-13", "2026-10-20"]);
    expect(second.map((delivery) => delivery.dueDate)).toEqual(["2026-10-13", "2026-10-20"]);
  });

  it("começa sem pesagem, sem entrega e sem recebimento", async () => {
    const [delivery] = await setup().service.listDeliveries(ME);

    expect(delivery).toMatchObject({ weighings: [], handedOverAt: null, handedOverOutOfRange: false, receipt: null });
  });

  it("uma proposta aceita durante o uso aparece na lista seguinte", async () => {
    const { service, proposals } = setup([proposal({ status: "PENDENTE", expiraEm: "2026-10-13T13:00:00.000Z" })]);
    expect(await service.listDeliveries(ME)).toEqual([]);

    await proposals.respond(ME, "d1", { answer: "ACEITAR", quantities: { d1: 10 } });

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
    const { service } = setup();
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
