import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  produto: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
  prod_Vendedor_Possui: { count: vi.fn() },
  itemPedido: { count: vi.fn() },
}));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
const uploadMock = vi.hoisted(() => ({ uploadFile: vi.fn(), removeByUrl: vi.fn() }));
vi.mock("@/lib/media/upload", async (importOriginal) => ({ ...(await importOriginal<typeof import("@/lib/media/upload")>()), ...uploadMock }));

import { authHeaders } from "@/test-utils/auth";
import { DELETE, GET, POST, PUT } from "./route";

const ADMIN = authHeaders("admin@x.com", "admin");
const url = "http://x/api/produtos";
const json = (method: string, body: unknown, headers: Record<string, string> = ADMIN) =>
  new Request(url, { method, headers: { ...headers, "content-type": "application/json" }, body: JSON.stringify(body) });
const valid = { nome: "Maçã Fuji", tipo: "Frutas", preco: "5,90", unidadePadrao: "Kg" };

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.produto.findMany.mockResolvedValue([]);
  prismaMock.produto.findUnique.mockResolvedValue({ cdProduto: 1, imagemUrl: "https://res.cloudinary.com/x/image/upload/raiz-conecta/produtos/old.jpg" });
  prismaMock.produto.create.mockImplementation(async ({ data }) => ({ cdProduto: 9, ...data }));
  prismaMock.produto.update.mockImplementation(async ({ data }) => ({ cdProduto: 1, ...data }));
  prismaMock.prod_Vendedor_Possui.count.mockResolvedValue(0);
  prismaMock.itemPedido.count.mockResolvedValue(0);
  uploadMock.uploadFile.mockResolvedValue("https://res.cloudinary.com/x/image/upload/raiz-conecta/produtos/new.jpg");
});

describe("GET /api/produtos", () => {
  it("quem não é admin só vê produtos ativos, mesmo pedindo todos", async () => {
    await GET(new Request(`${url}?todos=1`, { headers: authHeaders("p@x.com", "produtor") }));
    expect(prismaMock.produto.findMany.mock.calls[0][0].where).toEqual({ OR: [{ status: "ATIVO" }, { status: null }] });

    await GET(new Request(url));
    expect(prismaMock.produto.findMany.mock.calls[1][0].where).toEqual({ OR: [{ status: "ATIVO" }, { status: null }] });
  });

  it("o admin vê todos com ?todos=1", async () => {
    await GET(new Request(`${url}?todos=1`, { headers: ADMIN }));
    expect(prismaMock.produto.findMany.mock.calls[0][0].where).toBeUndefined();
  });
});

describe("POST /api/produtos", () => {
  it("só o admin cadastra", async () => {
    expect((await POST(json("POST", valid, {}))).status).toBe(401);
    expect((await POST(json("POST", valid, authHeaders("p@x.com", "produtor")))).status).toBe(403);
    expect((await POST(json("POST", valid, authHeaders("m@x.com", "mercado")))).status).toBe(403);
    expect(prismaMock.produto.create).not.toHaveBeenCalled();
  });

  it("cadastra com o preço arrumado e ativo", async () => {
    const response = await POST(json("POST", valid));

    expect(response.status).toBe(201);
    expect(prismaMock.produto.create).toHaveBeenCalledWith({
      data: { nome: "Maçã Fuji", tipo: "Frutas", preco: 5.9, unidadePadrao: "Kg", descricao: null, imagemUrl: null, status: "ATIVO" },
    });
  });

  it("recusa dados inválidos", async () => {
    expect((await POST(json("POST", { ...valid, preco: "0" }))).status).toBe(400);
    expect((await POST(json("POST", { ...valid, tipo: "Carros" }))).status).toBe(400);
  });

  it("sobe a foto enviada por formulário e recusa tipo errado", async () => {
    const form = (file: File) => {
      const f = new FormData();
      Object.entries(valid).forEach(([k, v]) => f.append(k, v));
      f.append("file", file);
      return new Request(url, { method: "POST", headers: ADMIN, body: f });
    };

    expect((await POST(form(new File(["x"], "a.png", { type: "image/png" })))).status).toBe(201);
    expect(prismaMock.produto.create.mock.calls[0][0].data.imagemUrl).toContain("new.jpg");
    expect((await POST(form(new File(["x"], "a.pdf", { type: "application/pdf" })))).status).toBe(400);
  });
});

describe("PUT /api/produtos", () => {
  it("só o admin edita", async () => {
    expect((await PUT(json("PUT", { id: 1, ...valid }, authHeaders("p@x.com", "produtor")))).status).toBe(403);
  });

  it("edita e, se veio foto nova, apaga a antiga só depois de gravar", async () => {
    const f = new FormData();
    Object.entries({ id: "1", ...valid }).forEach(([k, v]) => f.append(k, v));
    f.append("file", new File(["x"], "a.jpg", { type: "image/jpeg" }));

    const response = await PUT(new Request(url, { method: "PUT", headers: ADMIN, body: f }));

    expect(response.status).toBe(200);
    expect(prismaMock.produto.update.mock.calls[0][0].data.imagemUrl).toContain("new.jpg");
    expect(uploadMock.removeByUrl).toHaveBeenCalledWith(expect.stringContaining("old.jpg"), "produtos");
  });

  it("sem foto nova não mexe na imagem", async () => {
    await PUT(json("PUT", { id: 1, ...valid }));
    expect(prismaMock.produto.update.mock.calls[0][0].data).not.toHaveProperty("imagemUrl");
    expect(uploadMock.removeByUrl).not.toHaveBeenCalled();
  });

  it("reativa (ou desativa) o produto pelo status, ignorando valores estranhos", async () => {
    await PUT(json("PUT", { id: 1, ...valid, status: "ATIVO" }));
    expect(prismaMock.produto.update.mock.calls[0][0].data.status).toBe("ATIVO");

    await PUT(json("PUT", { id: 1, ...valid, status: "INATIVO" }));
    expect(prismaMock.produto.update.mock.calls[1][0].data.status).toBe("INATIVO");

    await PUT(json("PUT", { id: 1, ...valid, status: "QUALQUER" }));
    expect(prismaMock.produto.update.mock.calls[2][0].data).not.toHaveProperty("status");
  });

  it("pede o id e devolve 404 se o produto não existe", async () => {
    expect((await PUT(json("PUT", valid))).status).toBe(400);
    prismaMock.produto.findUnique.mockResolvedValue(null);
    expect((await PUT(json("PUT", { id: 7, ...valid }))).status).toBe(404);
  });
});

describe("DELETE /api/produtos", () => {
  const del = (query = "id=1", headers = ADMIN) => DELETE(new Request(`${url}?${query}`, { method: "DELETE", headers }));

  it("só o admin apaga", async () => {
    expect((await del("id=1", authHeaders("p@x.com", "produtor"))).status).toBe(403);
    expect(prismaMock.produto.delete).not.toHaveBeenCalled();
  });

  it("apaga de vez o produto sem ligações e remove a foto", async () => {
    const response = await del();

    expect(response.status).toBe(200);
    expect(prismaMock.produto.delete).toHaveBeenCalledWith({ where: { cdProduto: 1 } });
    expect(uploadMock.removeByUrl).toHaveBeenCalled();
  });

  it("com produtor ou pedido ligado só desativa (o histórico fica)", async () => {
    prismaMock.prod_Vendedor_Possui.count.mockResolvedValue(2);
    const data = await (await del()).json();

    expect(data.desativado).toBe(true);
    expect(prismaMock.produto.update).toHaveBeenCalledWith({ where: { cdProduto: 1 }, data: { status: "INATIVO" } });
    expect(prismaMock.produto.delete).not.toHaveBeenCalled();
  });

  it("valida o id", async () => {
    expect((await del("id=abc")).status).toBe(400);
    prismaMock.produto.findUnique.mockResolvedValue(null);
    expect((await del("id=5")).status).toBe(404);
  });
});
