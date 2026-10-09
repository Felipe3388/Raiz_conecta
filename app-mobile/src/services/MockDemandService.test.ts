import type { Demand } from "@/types/produtor";
import { MockDemandService } from "./MockDemandService";

const ME = "maria@sitio.com";

function demand(overrides: Partial<Demand> = {}): Demand {
  return {
    id: "d1",
    produto: "Tomate",
    quantidade: 100,
    unidade: "Caixas",
    precoMedio: 45,
    status: "ABERTA",
    ofertas: [],
    criadoEm: "2026-10-01T10:00:00.000Z",
    ...overrides,
  };
}

function createService(seed: Demand[] = [demand()]) {
  return new MockDemandService({ seed: () => seed, latencyMs: 0 });
}

describe("MockDemandService.listDemands", () => {
  it("devolve as demandas da base simulada", async () => {
    const list = await createService([demand({ id: "a" }), demand({ id: "b" })]).listDemands(ME);

    expect(list.map((d) => d.id)).toEqual(["a", "b"]);
  });

  it("monta a base de exemplo com o e-mail de quem está vendo", async () => {
    const seed = jest.fn(() => [demand()]);
    await new MockDemandService({ seed, latencyMs: 0 }).listDemands(ME);

    expect(seed).toHaveBeenCalledWith(ME);
  });

  it("recomeça a base de exemplo quando entra outra pessoa", async () => {
    const seed = jest.fn((email: string) => [demand({ ofertas: [{ quantidade: 5, emailProdutor: email }] })]);
    const service = new MockDemandService({ seed, latencyMs: 0 });

    await service.listDemands(ME);
    const [forJoao] = await service.listDemands("joao@fazenda.com");

    expect(seed).toHaveBeenCalledTimes(2);
    expect(forJoao.ofertas[0].emailProdutor).toBe("joao@fazenda.com");
  });

  it("mantém a base enquanto a mesma pessoa continua usando", async () => {
    const seed = jest.fn(() => [demand()]);
    const service = new MockDemandService({ seed, latencyMs: 0 });

    await service.listDemands(ME);
    await service.listDemands(ME);

    expect(seed).toHaveBeenCalledTimes(1);
  });

  it("não deixa quem chamou alterar a base sem querer", async () => {
    const service = createService();
    const [first] = await service.listDemands(ME);
    first.ofertas.push({ quantidade: 999, emailProdutor: "x@y.com" });

    const [again] = await service.listDemands(ME);
    expect(again.ofertas).toEqual([]);
  });
});

describe("MockDemandService.sendOffer", () => {
  it("registra a oferta e ela aparece na lista", async () => {
    const service = createService();

    await service.sendOffer({ demandaId: "d1", quantidade: 30, emailProdutor: ME });

    const [updated] = await service.listDemands(ME);
    expect(updated.ofertas).toEqual([{ quantidade: 30, emailProdutor: ME }]);
    expect(updated.status).toBe("ABERTA");
  });

  it("fecha a demanda quando o pedido é todo atendido", async () => {
    const service = createService([demand({ quantidade: 50 })]);

    await service.sendOffer({ demandaId: "d1", quantidade: 50, emailProdutor: ME });

    const [updated] = await service.listDemands(ME);
    expect(updated.status).toBe("CONCLUIDA");
  });

  it.each([
    ["demanda que não existe", { demandaId: "nao-existe", quantidade: 5 }, "Demanda não encontrada."],
    [
      "quantidade maior do que falta",
      { demandaId: "d1", quantidade: 101 },
      "A quantidade é maior do que falta para completar o pedido.",
    ],
    ["quantidade zero", { demandaId: "d1", quantidade: 0 }, "Informe uma quantidade válida."],
  ])("recusa %s", async (_name, request, message) => {
    await expect(createService().sendOffer({ ...request, emailProdutor: ME })).rejects.toThrow(message);
  });

  it("recusa demanda que já foi fechada", async () => {
    const service = createService([demand({ status: "CONCLUIDA" })]);

    await expect(service.sendOffer({ demandaId: "d1", quantidade: 5, emailProdutor: ME })).rejects.toThrow(
      "Esta demanda não está mais aberta.",
    );
  });

  it("recusa uma segunda oferta do mesmo produtor", async () => {
    const service = createService();
    await service.sendOffer({ demandaId: "d1", quantidade: 10, emailProdutor: ME });

    await expect(service.sendOffer({ demandaId: "d1", quantidade: 10, emailProdutor: ME })).rejects.toThrow(
      "Você já fez uma oferta para esta demanda.",
    );
  });
});

describe("MockDemandService: preço e desfazer", () => {
  it("guarda o preço combinado na oferta", async () => {
    const service = createService();

    await service.sendOffer({ demandaId: "d1", quantidade: 10, emailProdutor: ME, preco: 44.5 });

    const [list] = await service.listDemands(ME);
    expect(list.ofertas[0]).toEqual({ quantidade: 10, emailProdutor: ME, preco: 44.5 });
  });

  it("cancelar a oferta devolve a quantidade ao pedido", async () => {
    const service = createService();
    await service.sendOffer({ demandaId: "d1", quantidade: 10, emailProdutor: ME });

    await service.cancelOffer({ demandaId: "d1", emailProdutor: ME });

    const [list] = await service.listDemands(ME);
    expect(list.ofertas).toEqual([]);
  });

  it("cancelar a oferta que completava o pedido o reabre", async () => {
    const service = createService([demand({ quantidade: 10 })]);
    await service.sendOffer({ demandaId: "d1", quantidade: 10, emailProdutor: ME });
    expect((await service.listDemands(ME))[0].status).toBe("CONCLUIDA");

    await service.cancelOffer({ demandaId: "d1", emailProdutor: ME });

    expect((await service.listDemands(ME))[0].status).toBe("ABERTA");
  });

  it("só cancela a oferta de quem pediu, sem mexer nas dos outros", async () => {
    const service = createService([demand({ ofertas: [{ quantidade: 20, emailProdutor: "joao@fazenda.com" }] })]);
    await service.sendOffer({ demandaId: "d1", quantidade: 10, emailProdutor: ME });

    await service.cancelOffer({ demandaId: "d1", emailProdutor: ME });

    const [list] = await service.listDemands(ME);
    expect(list.ofertas).toEqual([{ quantidade: 20, emailProdutor: "joao@fazenda.com" }]);
  });

  it("avisa quando não há oferta para cancelar", async () => {
    await expect(createService().cancelOffer({ demandaId: "d1", emailProdutor: ME })).rejects.toThrow(
      "Você não tem oferta nesta demanda.",
    );
  });

  it("avisa quando a demanda não existe", async () => {
    await expect(createService().cancelOffer({ demandaId: "zzz", emailProdutor: ME })).rejects.toThrow(
      "Demanda não encontrada.",
    );
  });
});
