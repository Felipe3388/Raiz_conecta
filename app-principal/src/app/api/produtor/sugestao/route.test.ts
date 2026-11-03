import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({ sugestao: { findMany: vi.fn(), create: vi.fn(), findUnique: vi.fn(), delete: vi.fn() } }));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
const uploadMock = vi.hoisted(() => ({ uploadFile: vi.fn(), removeByUrl: vi.fn() }));
vi.mock("@/lib/media/upload", async (importOriginal) => ({ ...(await importOriginal<typeof import("@/lib/media/upload")>()), ...uploadMock }));
const notifyMock = vi.hoisted(() => ({ notify: vi.fn() }));
vi.mock("@/lib/notify/email", () => notifyMock);

import { authHeaders } from "@/test-utils/auth";
import { DELETE, GET, POST } from "./route";

const url = "http://localhost/api/produtor/sugestao";
const ME = "maria@teste.com";
const PRODUTOR = authHeaders(ME, "produtor");
const ADMIN = authHeaders("admin@x.com", "admin");

function form(fields: Record<string, string>, file?: File) {
  const f = new FormData();
  Object.entries(fields).forEach(([key, value]) => f.append(key, value));
  if (file) f.append("file", file);
  return f;
}
const post = (body: FormData, headers: Record<string, string> = PRODUTOR) => POST(new Request(url, { method: "POST", headers, body }));
const valid = { nomeProduto: "Pitaya", descricao: "Fruta do cerrado", precoSugerido: "12,50" };

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  prismaMock.sugestao.create.mockResolvedValue({});
  prismaMock.sugestao.findMany.mockResolvedValue([{ id: 1 }]);
  prismaMock.sugestao.findUnique.mockResolvedValue({ id: 3, imagemUrl: "https://res.cloudinary.com/x/image/upload/raiz-conecta/sugestoes/a.jpg" });
  uploadMock.uploadFile.mockResolvedValue("https://res.cloudinary.com/x/image/upload/raiz-conecta/sugestoes/new.jpg");
});

describe("GET /api/produtor/sugestao", () => {
  it("só o admin lê as sugestões", async () => {
    expect((await GET(new Request(url, { headers: ADMIN }))).status).toBe(200);
    expect((await GET(new Request(url, { headers: PRODUTOR }))).status).toBe(403);
    expect((await GET(new Request(url))).status).toBe(401);
  });
});

describe("POST /api/produtor/sugestao", () => {
  it("grava a sugestão com o e-mail da sessão, o preço arrumado, e avisa a administração", async () => {
    const response = await post(form({ ...valid, emailProdutor: ME }));

    expect(response.status).toBe(201);
    expect(prismaMock.sugestao.create).toHaveBeenCalledWith({
      data: { emailProdutor: ME, nomeProduto: "Pitaya", descricao: "Fruta do cerrado", imagemUrl: "", precoSugerido: 12.5 },
    });
    expect(notifyMock.notify).toHaveBeenCalledWith("sugestao", expect.objectContaining({ nomeProduto: "Pitaya" }));
  });

  it("não deixa sugerir em nome de outra pessoa nem como mercado", async () => {
    expect((await post(form({ ...valid, emailProdutor: "outra@teste.com" }))).status).toBe(403);
    expect((await post(form(valid), authHeaders(ME, "mercado"))).status).toBe(403);
    expect(prismaMock.sugestao.create).not.toHaveBeenCalled();
  });

  it("valida o nome, ignora preço inválido e corta a descrição", async () => {
    expect((await post(form({ ...valid, nomeProduto: "x" }))).status).toBe(400);

    await post(form({ ...valid, precoSugerido: "abc", descricao: "d".repeat(900) }));
    const data = prismaMock.sugestao.create.mock.calls[0][0].data;
    expect(data.precoSugerido).toBeNull();
    expect(data.descricao).toHaveLength(500);
  });

  it("sobe a foto e recusa arquivo que não é imagem", async () => {
    expect((await post(form(valid, new File(["x"], "a.png", { type: "image/png" })))).status).toBe(201);
    expect(prismaMock.sugestao.create.mock.calls[0][0].data.imagemUrl).toContain("new.jpg");

    expect((await post(form(valid, new File(["x"], "a.pdf", { type: "application/pdf" })))).status).toBe(400);
    expect(prismaMock.sugestao.create).toHaveBeenCalledTimes(1);
  });
});

describe("DELETE /api/produtor/sugestao", () => {
  const del = (query = "id=3", headers = ADMIN) => DELETE(new Request(`${url}?${query}`, { method: "DELETE", headers }));

  it("só o admin apaga, e a foto vai junto", async () => {
    expect((await del("id=3", PRODUTOR)).status).toBe(403);
    expect(prismaMock.sugestao.delete).not.toHaveBeenCalled();

    expect((await del()).status).toBe(200);
    expect(prismaMock.sugestao.delete).toHaveBeenCalledWith({ where: { id: 3 } });
    expect(uploadMock.removeByUrl).toHaveBeenCalledWith(expect.stringContaining("a.jpg"), "sugestoes");
  });

  it("valida o id e responde 404 se não existe", async () => {
    expect((await del("id=abc")).status).toBe(400);
    prismaMock.sugestao.findUnique.mockResolvedValue(null);
    expect((await del("id=9")).status).toBe(404);
  });
});
