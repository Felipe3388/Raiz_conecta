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

import { GET, POST } from "./route";
import { authHeaders } from "@/test-utils/auth";

// O token é do e-mail informado no corpo (ou de ana@sitio.com quando o corpo não traz e-mail).
function post(body: unknown, headers?: Record<string, string>) {
  const email = typeof body === "object" && body !== null && "email" in body ? String((body as { email: string }).email) : "ana@sitio.com";
  return POST(
    new Request("http://localhost/api/produtor/meus-produtos", {
      method: "POST",
      headers: headers ?? authHeaders(email),
      body: JSON.stringify(body),
    }),
  );
}

function get(query = "", headers: Record<string, string> = authHeaders("ana@sitio.com")) {
  return GET(new Request(`http://localhost/api/produtor/meus-produtos${query}`, { headers }));
}

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.vendedor.findUnique.mockResolvedValue({ cdVendedor: 7 });
  prismaMock.produto.findMany.mockResolvedValue([{ cdProduto: 1 }, { cdProduto: 2 }]);
  prismaMock.prod_Vendedor_Possui.findMany.mockResolvedValue([]);
  prismaMock.$transaction.mockResolvedValue([]);
});

describe("POST /api/produtor/meus-produtos", () => {
  it("recusa requisição sem token", async () => {
    const response = await post({ email: "ana@sitio.com", produtos: [] }, {});

    expect(response.status).toBe(401);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("recusa token de mercado e de admin", async () => {
    const response = await post({ email: "ana@sitio.com", produtos: [] }, authHeaders("ana@sitio.com", "mercado"));

    expect(response.status).toBe(403);
  });

  it("recusa gravar o catálogo de outro produtor (e-mail do corpo diferente do token)", async () => {
    const response = await post({ email: "outra@sitio.com", produtos: [] }, authHeaders("ana@sitio.com"));

    expect(response.status).toBe(403);
    expect(prismaMock.vendedor.findUnique).not.toHaveBeenCalled();
  });

  it("sem e-mail no corpo, usa o do token", async () => {
    const response = await post({ produtos: [{ cdProduto: 1 }] });

    expect(response.status).toBe(200);
    expect(prismaMock.vendedor.findUnique).toHaveBeenCalledWith({ where: { email: "ana@sitio.com" } });
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

describe("GET /api/produtor/meus-produtos", () => {
  beforeEach(() => {
    prismaMock.vendedor.findUnique.mockResolvedValue({
      cdVendedor: 7,
      Estoques: [
        { cdProduto: 1, preco: 9.5 },
        { cdProduto: 4, preco: null },
      ],
    });
  });

  it("devolve só os códigos dos produtos do catálogo", async () => {
    const response = await get();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([1, 4]);
  });

  it("com ?detalhes=1 devolve também o preço de cada produto", async () => {
    const response = await get("?detalhes=1");

    expect(await response.json()).toEqual([
      { cdProduto: 1, preco: 9.5 },
      { cdProduto: 4, preco: null },
    ]);
  });

  it("recusa sem token e ler o catálogo de outro produtor", async () => {
    expect((await get("", {})).status).toBe(401);
    expect((await get("?email=outra@sitio.com")).status).toBe(403);
    expect((await get("?email=ANA@sitio.com")).status).toBe(200);
  });
});
