import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  sugestao: {
    findMany: vi.fn(), create: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn(),
    updateMany: vi.fn(), deleteMany: vi.fn(),
  },
}));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
const uploadMock = vi.hoisted(() => ({ uploadFile: vi.fn(), removeByUrl: vi.fn() }));
vi.mock("@/lib/media/upload", async (importOriginal) => ({ ...(await importOriginal<typeof import("@/lib/media/upload")>()), ...uploadMock }));
const notifyMock = vi.hoisted(() => ({ notify: vi.fn() }));
vi.mock("@/lib/notify/email", () => notifyMock);

import { authHeaders } from "@/test-utils/auth";
import { DELETE, GET, PATCH, POST } from "./route";

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
const patch = (body: unknown, headers: Record<string, string> = ADMIN) => PATCH(new Request(url, { method: "PATCH", headers, body: JSON.stringify(body) }));
const del = (query = "id=3", headers = PRODUTOR) => DELETE(new Request(`${url}?${query}`, { method: "DELETE", headers }));
const valid = { nomeProduto: "Pitaya", descricao: "Fruta do cerrado", precoSugerido: "12,50" };

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  prismaMock.sugestao.create.mockResolvedValue({ id: 9, status: "EM_ANALISE" });
  prismaMock.sugestao.findMany.mockResolvedValue([{ id: 1, status: "EM_ANALISE" }]);
  prismaMock.sugestao.findUnique.mockResolvedValue({ id: 3, status: "EM_ANALISE" });
  prismaMock.sugestao.findFirst.mockResolvedValue({ id: 3, status: "EM_ANALISE", imagemUrl: "https://res.cloudinary.com/x/image/upload/raiz-conecta/sugestoes/a.jpg" });
  prismaMock.sugestao.updateMany.mockResolvedValue({ count: 1 });
  prismaMock.sugestao.deleteMany.mockResolvedValue({ count: 1 });
  uploadMock.uploadFile.mockResolvedValue("https://res.cloudinary.com/x/image/upload/raiz-conecta/sugestoes/new.jpg");
});

describe("GET /api/produtor/sugestao", () => {
  it("devolve somente o histórico próprio para o produtor", async () => {
    expect((await GET(new Request(url, { headers: PRODUTOR }))).status).toBe(200);
    expect(prismaMock.sugestao.findMany).toHaveBeenCalledWith({
      where: { emailProdutor: { equals: ME, mode: "insensitive" } },
      orderBy: { criadoEm: "desc" },
    });
    expect((await GET(new Request(url))).status).toBe(401);
  });

  it("devolve somente pendentes ao admin por padrão, ou histórico total se solicitado", async () => {
    expect((await GET(new Request(url, { headers: ADMIN }))).status).toBe(200);
    expect(prismaMock.sugestao.findMany).toHaveBeenLastCalledWith({ where: { status: "EM_ANALISE" }, orderBy: { criadoEm: "desc" } });
    await GET(new Request(`${url}?status=all`, { headers: ADMIN }));
    expect(prismaMock.sugestao.findMany).toHaveBeenLastCalledWith({ where: {}, orderBy: { criadoEm: "desc" } });
  });
});

describe("POST /api/produtor/sugestao", () => {
  it("grava a sugestão com o e-mail da sessão, informa ID real e avisa a administração", async () => {
    const response = await post(form({ ...valid, emailProdutor: ME }));
    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({ id: 9, status: "EM_ANALISE" });
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

  it("valida o nome, ignora preço inválido e limita a descrição", async () => {
    expect((await post(form({ ...valid, nomeProduto: "x" }))).status).toBe(400);
    await post(form({ ...valid, precoSugerido: "abc", descricao: "d".repeat(900) }));
    const data = prismaMock.sugestao.create.mock.calls[0][0].data;
    expect(data.precoSugerido).toBeNull();
    expect(data.descricao).toHaveLength(500);
  });

  it("aceita imagem e recusa arquivo que não é imagem", async () => {
    expect((await post(form(valid, new File(["x"], "a.png", { type: "image/png" })))).status).toBe(201);
    expect(prismaMock.sugestao.create.mock.calls[0][0].data.imagemUrl).toContain("new.jpg");
    expect((await post(form(valid, new File(["x"], "a.pdf", { type: "application/pdf" })))).status).toBe(400);
    expect(prismaMock.sugestao.create).toHaveBeenCalledTimes(1);
  });
});

describe("PATCH /api/produtor/sugestao", () => {
  it("recusa e preserva o histórico, incluindo o motivo", async () => {
    expect((await patch({ id: 3, status: "RECUSADA", motivo: "Já cadastrado" })).status).toBe(200);
    expect(prismaMock.sugestao.updateMany).toHaveBeenCalledWith({
      where: { id: 3, status: "EM_ANALISE" },
      data: { status: "RECUSADA", motivo: "Já cadastrado", decididoEm: expect.any(Date) },
    });
  });

  it("só admin pode recusar, não pode reavaliar nem inventar status", async () => {
    expect((await patch({ id: 3, status: "RECUSADA" }, PRODUTOR)).status).toBe(403);
    expect((await patch({ id: 3, status: "APROVADA" })).status).toBe(400);
    prismaMock.sugestao.findUnique.mockResolvedValue({ id: 3, status: "APROVADA" });
    expect((await patch({ id: 3, status: "RECUSADA" })).status).toBe(409);
    expect(prismaMock.sugestao.updateMany).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/produtor/sugestao", () => {
  it("só o próprio produtor pode desfazer enquanto pendente e apagar o arquivo", async () => {
    expect((await del("id=3", ADMIN)).status).toBe(403);
    expect((await del()).status).toBe(200);
    expect(prismaMock.sugestao.findFirst).toHaveBeenCalledWith({
      where: { id: 3, emailProdutor: { equals: ME, mode: "insensitive" } },
    });
    expect(prismaMock.sugestao.deleteMany).toHaveBeenCalledWith({
      where: { id: 3, emailProdutor: { equals: ME, mode: "insensitive" }, status: "EM_ANALISE" },
    });
    expect(uploadMock.removeByUrl).toHaveBeenCalledWith(expect.stringContaining("a.jpg"), "sugestoes");
  });

  it("recusa id inválido, outro dono e registro já aprovado", async () => {
    expect((await del("id=abc")).status).toBe(400);
    prismaMock.sugestao.findFirst.mockResolvedValueOnce(null);
    expect((await del("id=9")).status).toBe(404);
    prismaMock.sugestao.findFirst.mockResolvedValue({ id: 3, status: "APROVADA" });
    expect((await del()).status).toBe(409);
  });
});
