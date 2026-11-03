import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  cliente: { findFirst: vi.fn() },
  produto: { findMany: vi.fn() },
  demanda: { create: vi.fn((args) => args), findMany: vi.fn() },
  vendedor: { findMany: vi.fn() },
  $transaction: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import { authHeaders } from "@/test-utils/auth";
import { GET, POST } from "./route";

const ME = "mercado@teste.com";
const url = "http://x/api/mercado/demandas";
const post = (body: unknown, headers: Record<string, string> = authHeaders(ME, "mercado")) =>
  POST(new Request(url, { method: "POST", headers, body: JSON.stringify(body) }));

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.cliente.findFirst.mockResolvedValue({ status: "APROVADO" });
  prismaMock.produto.findMany.mockResolvedValue([
    { cdProduto: 1, nome: "Alface", preco: 4.5, unidadePadrao: "Maço" },
    { cdProduto: 2, nome: "Tomate", preco: 6, unidadePadrao: "Kg" },
  ]);
  prismaMock.$transaction.mockResolvedValue([]);
  prismaMock.demanda.findMany.mockResolvedValue([]);
  prismaMock.vendedor.findMany.mockResolvedValue([]);
});

describe("POST /api/mercado/demandas", () => {
  it("só mercado logado dispara cotação", async () => {
    expect((await post({ carrinho: [{ id: 1, qtd: 2 }] }, {})).status).toBe(401);
    expect((await post({ carrinho: [{ id: 1, qtd: 2 }] }, authHeaders("p@x.com", "produtor"))).status).toBe(403);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("cria um pedido por produto com nome, unidade e preço do CATÁLOGO, não da tela", async () => {
    const response = await post({ carrinho: [{ id: 1, qtd: 10, nome: "Ouro", precoEstimado: 0.01, unidade: "Tonelada" }, { id: 2, qtd: 5 }] });

    expect(response.status).toBe(201);
    const created = prismaMock.$transaction.mock.calls[0][0].map((c: { data: unknown }) => c.data);
    expect(created).toEqual([
      { produto: "Alface", quantidade: 10, unidade: "Maço", precoMedio: 4.5, emailMercado: ME, status: "ABERTA" },
      { produto: "Tomate", quantidade: 5, unidade: "Kg", precoMedio: 6, emailMercado: ME, status: "ABERTA" },
    ]);
  });

  it("usa o e-mail da sessão e recusa o de outro mercado", async () => {
    expect((await post({ emailMercado: "outro@x.com", carrinho: [{ id: 1, qtd: 1 }] })).status).toBe(403);
  });

  it("recusa carrinho inválido, produto indisponível e mercado não aprovado", async () => {
    expect((await post({ carrinho: [] })).status).toBe(400);
    expect((await post({ carrinho: [{ id: 1, qtd: -3 }] })).status).toBe(400);
    expect((await post({ carrinho: [{ id: 1, qtd: 1 }, { id: 99, qtd: 1 }] })).status).toBe(400);
    prismaMock.cliente.findFirst.mockResolvedValue({ status: "EM_ANALISE" });
    expect((await post({ carrinho: [{ id: 1, qtd: 1 }] })).status).toBe(403);
  });
});

describe("GET /api/mercado/demandas", () => {
  it("lista só as do mercado logado, com o nome do produtor e sem e-mail", async () => {
    prismaMock.demanda.findMany.mockResolvedValue([
      {
        id: "d1", produto: "Alface", quantidade: 100, unidade: "Kg", precoMedio: 4, status: "ABERTA", criadoEm: new Date("2026-10-26T10:00:00Z"), emailMercado: ME,
        ofertas: [{ id: "o1", quantidade: 40, emailProdutor: "maria@teste.com", status: "ACEITA", statusEntrega: "PENDENTE", nota: null }],
      },
    ]);
    prismaMock.vendedor.findMany.mockResolvedValue([{ email: "maria@teste.com", nomeFantasia: "Sítio Boa Vista" }]);

    const response = await GET(new Request(url, { headers: authHeaders(ME, "mercado") }));
    const data = await response.json();

    expect(prismaMock.demanda.findMany.mock.calls[0][0].where).toEqual({ emailMercado: { equals: ME, mode: "insensitive" } });
    expect(data[0]).toMatchObject({ id: "d1", garantido: 40, percentual: 40 });
    expect(data[0].ofertas[0].produtor).toBe("Sítio Boa Vista");
    expect(JSON.stringify(data)).not.toContain("@");
  });

  it("produtor e visitante não leem pedidos de mercado", async () => {
    expect((await GET(new Request(url))).status).toBe(401);
    expect((await GET(new Request(url, { headers: authHeaders("p@x.com", "produtor") }))).status).toBe(403);
  });
});
