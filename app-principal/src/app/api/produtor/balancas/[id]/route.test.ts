import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  balanca: { findUnique: vi.fn(), update: vi.fn() },
  leituraPeso: { deleteMany: vi.fn() },
  $transaction: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import { authHeaders } from "@/test-utils/auth";
import { DELETE, PATCH } from "./route";

const ME = "maria@teste.com";
const row = (extra = {}) => ({ id: "b1", deviceId: "A4CF129B07E1", nome: "Balança RC-01", apelido: null, vinculadaEm: new Date("2026-10-01T10:00:00Z"), emailProdutor: ME, conectada: true, ...extra });
const ctx = (id = "A4:CF:12:9B:07:E1") => ({ params: Promise.resolve({ id }) });
const call = (fn: typeof PATCH, body?: unknown, headers: Record<string, string> = authHeaders(ME, "produtor"), id?: string) =>
  fn(new Request("http://x/api/produtor/balancas/x", { method: "PATCH", headers, body: body === undefined ? undefined : JSON.stringify(body) }), ctx(id));

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.balanca.findUnique.mockResolvedValue(row());
  prismaMock.balanca.update.mockResolvedValue({});
  prismaMock.leituraPeso.deleteMany.mockResolvedValue({ count: 3 });
  prismaMock.$transaction.mockImplementation(async (run: (tx: unknown) => unknown) => run(prismaMock));
});

describe("PATCH /api/produtor/balancas/[id]", () => {
  it("renomeia com o nome arrumado (até 30 letras)", async () => {
    const response = await call(PATCH, { apelido: "  Balança   do galpão " });

    expect(response.status).toBe(200);
    expect((await response.json()).nickname).toBe("Balança do galpão");
    expect(prismaMock.balanca.update).toHaveBeenCalledWith({ where: { id: "b1" }, data: { apelido: "Balança do galpão" } });
    expect(prismaMock.balanca.findUnique).toHaveBeenCalledWith({ where: { deviceId: "A4CF129B07E1" } });
  });

  it("nome vazio ou null volta ao nome de fábrica", async () => {
    expect((await (await call(PATCH, { apelido: "   " })).json()).nickname).toBeNull();
    expect((await (await call(PATCH, { apelido: null })).json()).nickname).toBeNull();
  });

  it("corta nomes muito longos", async () => {
    const body = await (await call(PATCH, { apelido: "x".repeat(80) })).json();
    expect(body.nickname).toHaveLength(30);
  });

  it("balança de outra conta responde 404 como se não existisse", async () => {
    prismaMock.balanca.findUnique.mockResolvedValue(row({ emailProdutor: "outro@teste.com" }));
    expect((await call(PATCH, { apelido: "x" })).status).toBe(404);
    prismaMock.balanca.findUnique.mockResolvedValue(null);
    expect((await call(PATCH, { apelido: "x" })).status).toBe(404);
    expect(prismaMock.balanca.update).not.toHaveBeenCalled();
  });

  it("valida o corpo e o id", async () => {
    expect((await call(PATCH, {})).status).toBe(400);
    expect((await call(PATCH, { apelido: 5 })).status).toBe(400);
    expect((await call(PATCH, { apelido: "x" }, authHeaders(ME, "produtor"), "lixo")).status).toBe(404);
  });

  it("só produtor logado", async () => {
    expect((await call(PATCH, { apelido: "x" }, {})).status).toBe(401);
    expect((await call(PATCH, { apelido: "x" }, authHeaders("m@x.com", "mercado"))).status).toBe(403);
  });
});

describe("DELETE /api/produtor/balancas/[id]", () => {
  it("solta a balança e apaga o histórico dela", async () => {
    const response = await call(DELETE);

    expect(response.status).toBe(200);
    expect(prismaMock.leituraPeso.deleteMany).toHaveBeenCalledWith({ where: { balancaId: "b1" } });
    expect(prismaMock.balanca.update).toHaveBeenCalledWith({
      where: { id: "b1" },
      data: expect.objectContaining({ emailProdutor: null, apelido: null, conectada: false, vinculadaEm: null }),
    });
  });

  it("não solta balança de outra conta", async () => {
    prismaMock.balanca.findUnique.mockResolvedValue(row({ emailProdutor: "outro@teste.com" }));
    expect((await call(DELETE)).status).toBe(404);
    expect(prismaMock.balanca.update).not.toHaveBeenCalled();
  });
});
