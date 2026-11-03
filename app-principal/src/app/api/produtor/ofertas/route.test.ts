import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  vendedor: { findUnique: vi.fn() },
  demanda: { findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
  oferta: { create: vi.fn() },
  $transaction: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import { authHeaders } from "@/test-utils/auth";
import { GET, POST } from "./route";

const ME = "maria@teste.com";
const url = "http://localhost/api/produtor/ofertas";

const get = (headers: Record<string, string> = authHeaders(ME)) => GET(new Request(url, { headers }));
const post = (body: unknown, headers: Record<string, string> = authHeaders(ME)) =>
  POST(new Request(url, { method: "POST", headers, body: JSON.stringify(body) }));

const demanda = (over: Record<string, unknown> = {}) => ({
  id: "d1",
  produto: "Alface",
  quantidade: 100,
  unidade: "Kg",
  precoMedio: 5,
  status: "ABERTA",
  criadoEm: new Date("2026-10-20T10:00:00Z"),
  emailMercado: "mercado@secreto.com",
  ofertas: [],
  ...over,
});

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.vendedor.findUnique.mockResolvedValue({
    email: ME,
    status: "APROVADO",
    Estoques: [{ cdProduto: 1, Produto: { nome: "Alface" } }],
  });
  prismaMock.demanda.findMany.mockResolvedValue([demanda(), demanda({ id: "d2", produto: "Tomate" })]);
  prismaMock.demanda.findUnique.mockResolvedValue(demanda());
  // A transação roda a função recebida com o próprio mock como "tx".
  prismaMock.$transaction.mockImplementation(async (run: (tx: unknown) => unknown) => run(prismaMock));
});

describe("GET /api/produtor/ofertas", () => {
  it("monta o mural só com os pedidos dos produtos do catálogo", async () => {
    const response = await get();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.mural.map((item: { id: string }) => item.id)).toEqual(["d1"]);
    expect(data.resumo.paraResponder).toBe(1);
    expect(data.produtosNoCatalogo).toBe(1);
  });

  it("não expõe e-mail de mercado nem de outros produtores", async () => {
    prismaMock.demanda.findMany.mockResolvedValue([demanda({ ofertas: [{ quantidade: 10, emailProdutor: "outro@x.com" }] })]);
    const text = JSON.stringify(await (await get()).json());

    expect(text).not.toContain("mercado@secreto.com");
    expect(text).not.toContain("outro@x.com");
  });

  it("recusa sem token, mercado e produtor ainda não aprovado", async () => {
    expect((await get({})).status).toBe(401);
    expect((await get(authHeaders(ME, "mercado"))).status).toBe(403);
    prismaMock.vendedor.findUnique.mockResolvedValue({ email: ME, status: "EM_ANALISE", Estoques: [] });
    expect((await get()).status).toBe(403);
  });
});

describe("POST /api/produtor/ofertas", () => {
  it("registra a oferta com o e-mail do token", async () => {
    const response = await post({ demandaId: "d1", quantidade: 40 });

    expect(response.status).toBe(201);
    expect(prismaMock.oferta.create).toHaveBeenCalledWith({ data: { quantidade: 40, emailProdutor: ME, demandaId: "d1" } });
    expect(prismaMock.demanda.update).not.toHaveBeenCalled();
  });

  it("fecha o pedido quando a oferta completa a quantidade", async () => {
    prismaMock.demanda.findUnique.mockResolvedValue(demanda({ ofertas: [{ quantidade: 60, emailProdutor: "outro@x.com" }] }));

    const response = await post({ demandaId: "d1", quantidade: 40 });

    expect(response.status).toBe(201);
    expect(prismaMock.demanda.update).toHaveBeenCalledWith({ where: { id: "d1" }, data: { status: "CONCLUIDA" } });
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    expect(prismaMock.$transaction.mock.calls[0][1]).toMatchObject({ isolationLevel: "Serializable" });
  });

  it("tenta de novo quando o banco desfaz a transação por conflito", async () => {
    prismaMock.$transaction
      .mockRejectedValueOnce(Object.assign(new Error("conflito"), { code: "P2034" }))
      .mockImplementation(async (run: (tx: unknown) => unknown) => run(prismaMock));

    const response = await post({ demandaId: "d1", quantidade: 40 });

    expect(response.status).toBe(201);
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(2);
  });

  it("recusa mais do que o mercado precisa", async () => {
    prismaMock.demanda.findUnique.mockResolvedValue(demanda({ ofertas: [{ quantidade: 60, emailProdutor: "outro@x.com" }] }));

    const response = await post({ demandaId: "d1", quantidade: 41 });

    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe("O mercado só precisa de mais 40 Kg deste item.");
    expect(prismaMock.oferta.create).not.toHaveBeenCalled();
  });

  it("recusa quantidade inválida, segunda oferta e pedido fechado", async () => {
    expect((await post({ demandaId: "d1", quantidade: 0 })).status).toBe(400);
    expect((await post({ demandaId: "d1", quantidade: 2.5 })).status).toBe(400);

    prismaMock.demanda.findUnique.mockResolvedValue(demanda({ ofertas: [{ quantidade: 5, emailProdutor: ME }] }));
    expect((await post({ demandaId: "d1", quantidade: 5 })).status).toBe(400);

    prismaMock.demanda.findUnique.mockResolvedValue(demanda({ status: "CONCLUIDA" }));
    expect((await post({ demandaId: "d1", quantidade: 5 })).status).toBe(400);
  });

  it("recusa dados incompletos e pedido que não existe", async () => {
    expect((await post({ quantidade: 5 })).status).toBe(400);
    prismaMock.demanda.findUnique.mockResolvedValue(null);
    expect((await post({ demandaId: "nada", quantidade: 5 })).status).toBe(404);
  });

  it("não deixa ofertar em nome de outro produtor", async () => {
    const response = await post({ demandaId: "d1", quantidade: 5, emailProdutor: "outro@x.com" });

    expect(response.status).toBe(403);
    expect(prismaMock.oferta.create).not.toHaveBeenCalled();
  });

  it("recusa sem token e produtor não aprovado", async () => {
    expect((await post({ demandaId: "d1", quantidade: 5 }, {})).status).toBe(401);
    prismaMock.vendedor.findUnique.mockResolvedValue({ email: ME, status: "REJEITADO", Estoques: [] });
    expect((await post({ demandaId: "d1", quantidade: 5 })).status).toBe(403);
  });
});
