import { ApiProposalService, MURAL_MARKET_NAME, OPEN_WINDOW_MS, orderNumber } from "./ApiProposalService";

// Terça, 13/10/2026: o próximo dia de entrega é o próprio dia.
const NOW = new Date(2026, 9, 13, 10, 0, 0);

const item = (over: Record<string, unknown> = {}) => ({
  id: "d-1",
  produto: "Tomate",
  quantidade: 100,
  unidade: "Caixas",
  precoMedio: 8,
  status: "ABERTA",
  atendido: 40,
  faltante: 60,
  percentual: 40,
  criadoEm: "2026-10-12T15:00:00.000Z",
  minhaQuantidade: null,
  ...over,
});

function makeService(payload: { mural: unknown[]; minhas: unknown[] }) {
  const api = { get: jest.fn().mockResolvedValue(payload), post: jest.fn().mockResolvedValue({ message: "ok" }) };
  return { api, service: new ApiProposalService(api as never, () => NOW) };
}

describe("ApiProposalService", () => {
  it("lê o mural do produtor logado (sem e-mail na URL)", async () => {
    const { api, service } = makeService({ mural: [], minhas: [] });
    await service.listProposals("a@b.c");
    expect(api.get).toHaveBeenCalledWith("/api/produtor/ofertas");
  });

  it("transforma pedido aberto em proposta pendente com o que falta, em kg e a preço médio", async () => {
    const { service } = makeService({ mural: [item()], minhas: [] });
    const [proposal] = await service.listProposals("a@b.c");

    expect(proposal).toMatchObject({
      id: "d-1",
      mercado: MURAL_MARKET_NAME,
      entrega: "2026-10-13",
      status: "PENDENTE",
      recebidaEm: "2026-10-12T15:00:00.000Z",
      respondidaEm: null,
    });
    expect(proposal.numero).toBe(orderNumber("d-1"));
    expect(proposal.itens).toEqual([
      { id: "d-1", produto: "Tomate", quantidade: 60, unidade: "kg", preco: 8, aceita: null },
    ]);
    expect(Date.parse(proposal.expiraEm) - NOW.getTime()).toBe(OPEN_WINDOW_MS);
  });

  it("transforma oferta já feita em proposta aceita com a quantidade garantida", async () => {
    const { service } = makeService({ mural: [], minhas: [item({ id: "d-2", minhaQuantidade: 20, atendido: 100, faltante: 0, status: "CONCLUIDA" })] });
    const [proposal] = await service.listProposals("a@b.c");

    expect(proposal.status).toBe("ACEITA");
    expect(proposal.itens[0]).toMatchObject({ quantidade: 100, aceita: 20, preco: 8 });
  });

  it("mostra o nome do mercado que o site manda, e um nome padrão quando não vem", async () => {
    const { service } = makeService({
      mural: [item({ id: "d-1", mercado: "  Hortifruti Bom Preço " }), item({ id: "d-2" }), item({ id: "d-3", mercado: "  " })],
      minhas: [item({ id: "d-4", mercado: "Empório São José", minhaQuantidade: 5 })],
    });
    const proposals = await service.listProposals("a@b.c");

    expect(proposals.map((proposal) => proposal.mercado)).toEqual([
      "Hortifruti Bom Preço",
      MURAL_MARKET_NAME,
      MURAL_MARKET_NAME,
      "Empório São José",
    ]);
  });

  it("ignora pedido aberto sem nada faltando", async () => {
    const { service } = makeService({ mural: [item({ faltante: 0 })], minhas: [] });
    expect(await service.listProposals("a@b.c")).toEqual([]);
  });

  it("aceitar envia demandaId e quantidade inteira ao site", async () => {
    const { api, service } = makeService({ mural: [item()], minhas: [] });
    const updated = await service.respond("a@b.c", "d-1", { answer: "ACEITAR", quantities: { "d-1": 25 } });

    expect(api.post).toHaveBeenCalledWith("/api/produtor/ofertas", { demandaId: "d-1", quantidade: 25 });
    expect(updated.status).toBe("ACEITA");
    expect(updated.itens[0].aceita).toBe(25);
    expect(updated.respondidaEm).toBe(NOW.toISOString());
  });

  it("não chama o site com quantidade acima do que falta ou zerada", async () => {
    const { api, service } = makeService({ mural: [item()], minhas: [] });

    await expect(service.respond("a@b.c", "d-1", { answer: "ACEITAR", quantities: { "d-1": 61 } })).rejects.toThrow("0 a 60");
    await expect(service.respond("a@b.c", "d-1", { answer: "ACEITAR", quantities: { "d-1": 0 } })).rejects.toThrow("pelo menos um");
    expect(api.post).not.toHaveBeenCalled();
  });

  it("repassa o erro do site quando ele recusa a oferta", async () => {
    const { api, service } = makeService({ mural: [item()], minhas: [] });
    api.post.mockRejectedValue(new Error("O mercado só precisa de mais 10 kg deste item."));

    await expect(service.respond("a@b.c", "d-1", { answer: "ACEITAR", quantities: { "d-1": 30 } })).rejects.toThrow("só precisa de mais 10");
  });

  it("recusar não chama o site e o pedido segue recusado nas próximas listas", async () => {
    const { api, service } = makeService({ mural: [item()], minhas: [] });
    const updated = await service.respond("a@b.c", "d-1", { answer: "RECUSAR" });

    expect(api.post).not.toHaveBeenCalled();
    expect(updated.status).toBe("RECUSADA");
    expect(updated.itens[0].aceita).toBe(0);

    const [again] = await service.listProposals("A@B.C");
    expect(again.status).toBe("RECUSADA");
    expect(again.respondidaEm).toBe(NOW.toISOString());
  });

  it("não responde de novo o que já foi respondido nem o que não existe", async () => {
    const { service } = makeService({ mural: [], minhas: [item({ minhaQuantidade: 10 })] });
    await expect(service.respond("a@b.c", "d-1", { answer: "RECUSAR" })).rejects.toThrow("já foi respondida");
    await expect(service.respond("a@b.c", "nada", { answer: "RECUSAR" })).rejects.toThrow("não encontrada");
  });

  it("o número do pedido é estável e tem 4 dígitos", () => {
    expect(orderNumber("d-1")).toBe(orderNumber("d-1"));
    expect(orderNumber("0b1f3c2e-9a4d-4f6e-8c7a-1234567890ab")).toBeGreaterThanOrEqual(1000);
    expect(orderNumber("0b1f3c2e-9a4d-4f6e-8c7a-1234567890ab")).toBeLessThan(10000);
  });
});
