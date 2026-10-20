import { isDeliveryDay } from "@/lib/delivery/schedule";
import { filterProposals, groupByMarket, PROPOSAL_WINDOW_MINUTES } from "@/lib/produtor/proposals";
import { seedProposals } from "./proposalData";

const NOW = new Date(2026, 9, 13, 9, 30);

describe("pedidos de exemplo", () => {
  const proposals = seedProposals(NOW);
  const items = proposals.flatMap((order) => order.itens);

  it("pedidos e produtos têm código único, e o número do pedido também", () => {
    expect(new Set(proposals.map((order) => order.id)).size).toBe(proposals.length);
    expect(new Set(proposals.map((order) => order.numero)).size).toBe(proposals.length);
    expect(new Set(items.map((entry) => entry.id)).size).toBe(items.length);
  });

  it("toda entrega cai em um dia de entrega (terça ou sexta), hoje ou depois", () => {
    for (const order of proposals) {
      expect(isDeliveryDay(order.entrega)).toBe(true);
      expect(order.entrega >= "2026-10-13").toBe(true);
    }
  });

  it("cada filtro da tela tem o que mostrar", () => {
    for (const filter of ["pending", "accepted", "closed"] as const) {
      expect(filterProposals(proposals, filter, NOW).length).toBeGreaterThanOrEqual(2);
    }
  });

  it("o preço é fixo, positivo e vem da escada (abaixo do que o mercado paga)", () => {
    for (const entry of items) expect(entry.preco).toBeGreaterThan(0);
    const abacaxi = items.find((entry) => entry.produto === "Abacaxi");
    expect(abacaxi?.preco).toBe(4.1);
  });

  it("um mercado tem vários pedidos, e um pedido tem vários produtos", () => {
    const groups = groupByMarket(proposals);
    expect(groups.map((group) => group.orders.length)).toEqual([3, 3, 2]);
    expect(proposals.some((order) => order.itens.length > 1)).toBe(true);
    expect(proposals.some((order) => order.itens.length === 1)).toBe(true);
  });

  it("o Mercado Teste tem 30 kg de morango e 40 kg de abacaxi aceitos no mesmo pedido, para hoje", () => {
    const order = proposals.find((entry) => entry.mercado === "Mercado Teste" && entry.status === "ACEITA");
    expect(order?.itens.map((entry) => [entry.produto, entry.quantidade, entry.aceita])).toEqual([
      ["Morango", 30, 30],
      ["Abacaxi", 40, 40],
    ]);
    expect(order?.entrega).toBe("2026-10-13");
  });

  it("há um pedido aceito pela metade: o resto segue para outros produtores", () => {
    const alface = items.find((entry) => entry.produto === "Alface" && entry.aceita !== null && entry.aceita > 0);
    expect(alface).toMatchObject({ quantidade: 30, aceita: 20 });
  });

  it("pendentes têm até 30 minutos e prazo no futuro; só as aceitas e recusadas têm hora de resposta", () => {
    for (const order of proposals) {
      if (order.status === "PENDENTE") {
        const left = (Date.parse(order.expiraEm) - NOW.getTime()) / 60_000;
        expect(left).toBeGreaterThan(0);
        expect(left).toBeLessThanOrEqual(PROPOSAL_WINDOW_MINUTES);
      }
      expect(order.respondidaEm === null).toBe(order.status === "PENDENTE" || order.status === "EXPIRADA");
    }
  });

  it("antes de responder, nada foi aceito; recusado fica com 0", () => {
    for (const order of proposals) {
      for (const entry of order.itens) {
        if (order.status === "PENDENTE" || order.status === "EXPIRADA") expect(entry.aceita).toBeNull();
        if (order.status === "RECUSADA") expect(entry.aceita).toBe(0);
      }
    }
  });
});
