import type { Proposal } from "@/types/proposal";
import { MockProposalService } from "./MockProposalService";

const ME = "maria@sitio.com";
let now = new Date("2026-10-13T12:00:00.000Z");
const inMinutes = (minutes: number) => new Date(now.getTime() + minutes * 60_000).toISOString();

function proposal(overrides: Partial<Proposal> = {}): Proposal {
  return {
    id: "p1",
    numero: 1,
    mercado: "Mercado Teste",
    itens: [
      { id: "i1", produto: "Abacaxi", quantidade: 40, unidade: "Kg", preco: 4, aceita: null },
      { id: "i2", produto: "Morango", quantidade: 30, unidade: "Kg", preco: 12, aceita: null },
    ],
    entrega: "2026-10-16",
    status: "PENDENTE",
    recebidaEm: inMinutes(-1),
    expiraEm: inMinutes(10),
    respondidaEm: null,
    ...overrides,
  };
}

function createService(seed: Proposal[] = [proposal()]) {
  return new MockProposalService({ seed: () => seed, now: () => now, latencyMs: 0 });
}

beforeEach(() => {
  now = new Date("2026-10-13T12:00:00.000Z");
});

describe("MockProposalService.listProposals", () => {
  it("devolve as propostas da base simulada", async () => {
    const list = await createService([proposal({ id: "a" }), proposal({ id: "b" })]).listProposals(ME);
    expect(list.map((item) => item.id)).toEqual(["a", "b"]);
  });

  it("monta a base de exemplo com a hora atual", async () => {
    const seed = jest.fn(() => [proposal()]);
    await new MockProposalService({ seed, now: () => now, latencyMs: 0 }).listProposals(ME);
    expect(seed).toHaveBeenCalledWith(now);
  });

  it("recomeça a base quando entra outra pessoa e mantém enquanto é a mesma", async () => {
    const seed = jest.fn(() => [proposal()]);
    const service = new MockProposalService({ seed, now: () => now, latencyMs: 0 });
    await service.listProposals(ME);
    await service.listProposals(ME);
    expect(seed).toHaveBeenCalledTimes(1);
    await service.listProposals("joao@fazenda.com");
    expect(seed).toHaveBeenCalledTimes(2);
  });

  it("a proposta pendente que passou do prazo volta como expirada", async () => {
    const service = createService([proposal({ expiraEm: inMinutes(5) })]);
    now = new Date(now.getTime() + 6 * 60_000);

    const [item] = await service.listProposals(ME);

    expect(item.status).toBe("EXPIRADA");
  });

  it("não deixa quem chamou alterar a base sem querer", async () => {
    const service = createService();
    const [item] = await service.listProposals(ME);
    item.status = "ACEITA";
    expect((await service.listProposals(ME))[0].status).toBe("PENDENTE");
  });
});

const ALL = { answer: "ACEITAR", quantities: { i1: 40, i2: 30 } } as const;
const REFUSE = { answer: "RECUSAR" } as const;

describe("MockProposalService.respond", () => {
  it("aceitar marca o pedido como aceito, guarda a quantidade de cada produto e a hora", async () => {
    const service = createService();

    const updated = await service.respond(ME, "p1", ALL);

    expect(updated).toMatchObject({ status: "ACEITA", respondidaEm: now.toISOString() });
    expect(updated.itens.map((entry) => entry.aceita)).toEqual([40, 30]);
    expect((await service.listProposals(ME))[0].status).toBe("ACEITA");
  });

  it("aceita só uma parte: o que ficou de fora vale 0 e o resto segue para outros produtores", async () => {
    const updated = await createService().respond(ME, "p1", { answer: "ACEITAR", quantities: { i1: 15 } });

    expect(updated.status).toBe("ACEITA");
    expect(updated.itens.map((entry) => entry.aceita)).toEqual([15, 0]);
  });

  it("recusar marca o pedido como recusado e zera tudo", async () => {
    const updated = await createService().respond(ME, "p1", REFUSE);
    expect(updated.status).toBe("RECUSADA");
    expect(updated.itens.map((entry) => entry.aceita)).toEqual([0, 0]);
  });

  it("não aceita mais do que foi oferecido, produto de fora do pedido nem pedido vazio", async () => {
    const service = createService();
    await expect(service.respond(ME, "p1", { answer: "ACEITAR", quantities: { i1: 41 } })).rejects.toThrow("0 a 40");
    await expect(service.respond(ME, "p1", { answer: "ACEITAR", quantities: { x: 1 } })).rejects.toThrow(
      "não faz parte",
    );
    await expect(service.respond(ME, "p1", { answer: "ACEITAR", quantities: { i1: 0 } })).rejects.toThrow(
      "pelo menos um",
    );
    expect((await service.listProposals(ME))[0]).toMatchObject({ status: "PENDENTE", respondidaEm: null });
  });

  it("pedido que não existe", async () => {
    await expect(createService().respond(ME, "nada", ALL)).rejects.toThrow("Proposta não encontrada");
  });

  it("depois do prazo não dá mais para responder, e ele fica expirado", async () => {
    const service = createService([proposal({ expiraEm: inMinutes(5) })]);
    now = new Date(now.getTime() + 5 * 60_000);

    await expect(service.respond(ME, "p1", ALL)).rejects.toThrow("prazo");
    expect((await service.listProposals(ME))[0].status).toBe("EXPIRADA");
  });

  it("não responde duas vezes ao mesmo pedido", async () => {
    const service = createService();
    await service.respond(ME, "p1", REFUSE);
    await expect(service.respond(ME, "p1", ALL)).rejects.toThrow("já foi respondida");
  });

  it("o que o produtor respondeu fica só com ele", async () => {
    const seed = () => [proposal()];
    const service = new MockProposalService({ seed, now: () => now, latencyMs: 0 });
    await service.listProposals(ME);
    await service.respond(ME, "p1", ALL);

    expect((await service.listProposals("joao@fazenda.com"))[0].status).toBe("PENDENTE");
  });
});
