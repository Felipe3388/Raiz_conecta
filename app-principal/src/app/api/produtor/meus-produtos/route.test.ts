import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  vendedor: { findUnique: vi.fn() },
  produto: { findMany: vi.fn() },
  prod_Vendedor_Possui: {
    findMany: vi.fn(),
    deleteMany: vi.fn(),
    createMany: vi.fn(),
    update: vi.fn(),
  },
  $transaction: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import { POST } from "./route";

function post(body: unknown) {
  return POST(
    new Request("http://localhost/api/produtor/meus-produtos", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.vendedor.findUnique.mockResolvedValue({ cdVendedor: 7 });
  prismaMock.produto.findMany.mockResolvedValue([{ cdProduto: 1 }, { cdProduto: 2 }]);
  prismaMock.prod_Vendedor_Possui.findMany.mockResolvedValue([]);
  prismaMock.$transaction.mockResolvedValue([]);
});

describe("POST /api/produtor/meus-produtos", () => {
  it("recusa requisição sem e-mail", async () => {
    const response = await post({ produtos: [] });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "E-mail não fornecido" });
  });

  it("recusa requisição sem a lista de produtos", async () => {
    const response = await post({ email: "ana@sitio.com" });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Informe a lista de produtos." });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("devolve 404 quando o produtor não existe", async () => {
    prismaMock.vendedor.findUnique.mockResolvedValue(null);

    const response = await post({ email: "x@y.com", produtos: [] });

    expect(response.status).toBe(404);
  });

  it("recusa produtos que não existem no catálogo oficial", async () => {
    prismaMock.produto.findMany.mockResolvedValue([{ cdProduto: 1 }]);

    const response = await post({
      email: "ana@sitio.com",
      produtos: [{ cdProduto: 1 }, { cdProduto: 2 }],
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Produto(s) não encontrado(s): 2." });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("grava o preço sugerido ao selecionar o produto", async () => {
    const response = await post({
      email: "ana@sitio.com",
      produtos: [{ cdProduto: 1, preco: 9.9 }],
    });

    expect(response.status).toBe(200);
    expect(prismaMock.prod_Vendedor_Possui.createMany).toHaveBeenCalledWith({
      data: [
        {
          cdProduto: 1,
          preco: 9.9,
          dtAtzPreco: expect.any(Date),
          cdVendedor: 7,
          saldo: 0,
        },
      ],
    });
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
  });

  it("atualiza o preço de um vínculo existente", async () => {
    prismaMock.prod_Vendedor_Possui.findMany.mockResolvedValue([
      { idRegistro: 10, cdProduto: 1, preco: 5 },
    ]);

    await post({ email: "ana@sitio.com", produtos: [{ cdProduto: 1, preco: 7 }] });

    expect(prismaMock.prod_Vendedor_Possui.update).toHaveBeenCalledWith({
      where: { idRegistro: 10 },
      data: { preco: 7, dtAtzPreco: expect.any(Date) },
    });
  });

  it("formato antigo (produtosIds) não apaga os preços já definidos", async () => {
    prismaMock.prod_Vendedor_Possui.findMany.mockResolvedValue([
      { idRegistro: 10, cdProduto: 1, preco: 5 },
    ]);

    const response = await post({ email: "ana@sitio.com", produtosIds: [1] });

    expect(response.status).toBe(200);
    expect(prismaMock.prod_Vendedor_Possui.deleteMany).toHaveBeenCalledWith({
      where: { idRegistro: { in: [] } },
    });
    expect(prismaMock.prod_Vendedor_Possui.update).not.toHaveBeenCalled();
    expect(prismaMock.prod_Vendedor_Possui.createMany).toHaveBeenCalledWith({ data: [] });
  });

  it("remove do catálogo o que o produtor desmarcou", async () => {
    prismaMock.prod_Vendedor_Possui.findMany.mockResolvedValue([
      { idRegistro: 10, cdProduto: 1, preco: 5 },
      { idRegistro: 11, cdProduto: 2, preco: null },
    ]);

    await post({ email: "ana@sitio.com", produtosIds: [1] });

    expect(prismaMock.prod_Vendedor_Possui.deleteMany).toHaveBeenCalledWith({
      where: { idRegistro: { in: [11] } },
    });
  });

  it("devolve 500 quando a transação falha", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    prismaMock.$transaction.mockRejectedValue(new Error("db fora do ar"));

    const response = await post({ email: "ana@sitio.com", produtos: [] });

    expect(response.status).toBe(500);
  });
});
