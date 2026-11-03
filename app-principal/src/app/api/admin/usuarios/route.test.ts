import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  vendedor: { findMany: vi.fn(), update: vi.fn(), delete: vi.fn() },
  cliente: { findMany: vi.fn(), update: vi.fn(), delete: vi.fn() },
  acesso: { findMany: vi.fn(), updateMany: vi.fn(), deleteMany: vi.fn() },
  $transaction: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
const notifyMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/notify/email", () => ({ notify: notifyMock }));

import { authHeaders } from "@/test-utils/auth";
import { DELETE, GET, PATCH, PUT } from "./route";

const ADMIN = authHeaders("admin@raizconecta.com.br", "admin");
const url = "http://x/api/admin/usuarios";
const send = (method: "PUT" | "PATCH", body: unknown, headers = ADMIN) => (method === "PUT" ? PUT : PATCH)(new Request(url, { method, headers, body: JSON.stringify(body) }));

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.$transaction.mockResolvedValue([]);
  prismaMock.vendedor.findMany.mockResolvedValue([{ email: "p@x.com", nomeFantasia: "Sítio", status: "EM_ANALISE" }]);
  prismaMock.cliente.findMany.mockResolvedValue([{ email: "m@x.com", nomeFantasia: "Mercado", status: "APROVADO" }]);
  prismaMock.acesso.findMany.mockResolvedValue([{ login: "admin@raizconecta.com.br", status: "APROVADO" }]);
});

describe("segurança", () => {
  it.each([
    ["GET", () => GET(new Request(url))],
    ["PUT", () => PUT(new Request(url, { method: "PUT", body: "{}" }))],
    ["PATCH", () => PATCH(new Request(url, { method: "PATCH", body: "{}" }))],
    ["DELETE", () => DELETE(new Request(`${url}?email=a@b.com&tipo=produtor`, { method: "DELETE" }))],
  ])("%s sem login responde 401", async (_name, call) => {
    expect((await call()).status).toBe(401);
  });

  it("produtor e mercado recebem 403 em tudo", async () => {
    for (const role of ["produtor", "mercado"] as const) {
      const headers = authHeaders("x@y.com", role);
      expect((await GET(new Request(url, { headers }))).status).toBe(403);
      expect((await send("PUT", { email: "a@b.com", tipo: "produtor", novoStatus: "APROVADO" }, headers)).status).toBe(403);
      expect((await DELETE(new Request(`${url}?email=a@b.com&tipo=produtor`, { method: "DELETE", headers }))).status).toBe(403);
    }
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });
});

describe("GET /api/admin/usuarios", () => {
  it("junta produtores, mercados e administradores, sem a coluna senha", async () => {
    const response = await GET(new Request(url, { headers: ADMIN }));
    const data = await response.json();

    expect(data.map((u: { tipo: string }) => u.tipo)).toEqual(["produtor", "mercado", "admin"]);
    expect(prismaMock.vendedor.findMany.mock.calls[0][0].select.senha).toBeUndefined();
    expect(prismaMock.vendedor.findMany.mock.calls[0][0].select.email).toBe(true);
  });
});

describe("PUT /api/admin/usuarios", () => {
  it("aprova: muda perfil e acesso na mesma transação e avisa por e-mail", async () => {
    const response = await send("PUT", { email: "p@x.com", tipo: "produtor", novoStatus: "APROVADO" });

    expect(response.status).toBe(200);
    expect(prismaMock.vendedor.update).toHaveBeenCalledWith({ where: { email: "p@x.com" }, data: { status: "APROVADO" } });
    expect(prismaMock.acesso.updateMany).toHaveBeenCalledWith({ where: { login: "p@x.com" }, data: { status: "APROVADO" } });
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    expect(notifyMock).toHaveBeenCalledWith("aprovacao", { email: "p@x.com" });
  });

  it("rejeitar apaga o link do documento; suspender manda o motivo", async () => {
    await send("PUT", { email: "m@x.com", tipo: "mercado", novoStatus: "REJEITADO" });
    expect(prismaMock.cliente.update).toHaveBeenCalledWith({ where: { email: "m@x.com" }, data: { status: "REJEITADO", urlDocumento: null } });

    await send("PUT", { email: "m@x.com", tipo: "mercado", novoStatus: "SUSPENSO", motivo: " fraude " });
    expect(notifyMock).toHaveBeenLastCalledWith("suspensao", { email: "m@x.com", motivo: "fraude" });
  });

  it("recusa tipo admin, status inventado e corpo vazio", async () => {
    expect((await send("PUT", { email: "a@x.com", tipo: "admin", novoStatus: "SUSPENSO" })).status).toBe(400);
    expect((await send("PUT", { email: "p@x.com", tipo: "produtor", novoStatus: "BANIDO" })).status).toBe(400);
    expect((await send("PUT", {})).status).toBe(400);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("usuário que não existe devolve 404", async () => {
    prismaMock.$transaction.mockRejectedValue(Object.assign(new Error("x"), { code: "P2025" }));
    expect((await send("PUT", { email: "x@x.com", tipo: "produtor", novoStatus: "APROVADO" })).status).toBe(404);
  });
});

describe("PATCH /api/admin/usuarios", () => {
  it("edita só os campos permitidos", async () => {
    const response = await send("PATCH", { email: "p@x.com", tipo: "produtor", nomeFantasia: "Novo Nome", cidade: "Sorocaba", status: "APROVADO", documento: "1" });

    expect(response.status).toBe(200);
    expect(prismaMock.vendedor.update).toHaveBeenCalledWith({ where: { email: "p@x.com" }, data: { nomeFantasia: "Novo Nome", cidade: "Sorocaba" } });
  });

  it("recusa quando não há nada válido para atualizar", async () => {
    expect((await send("PATCH", { email: "p@x.com", tipo: "produtor", status: "APROVADO" })).status).toBe(400);
  });
});

describe("DELETE /api/admin/usuarios", () => {
  const del = (query: string) => DELETE(new Request(`${url}?${query}`, { method: "DELETE", headers: ADMIN }));

  it("exclui a conta e avisa o usuário", async () => {
    const response = await del("email=p@x.com&tipo=produtor&motivo=pedido");

    expect(response.status).toBe(200);
    expect(prismaMock.acesso.deleteMany).toHaveBeenCalledWith({ where: { login: "p@x.com" } });
    expect(prismaMock.vendedor.delete).toHaveBeenCalledWith({ where: { email: "p@x.com" } });
    expect(notifyMock).toHaveBeenCalledWith("exclusao", { email: "p@x.com", motivo: "pedido" });
  });

  it("não apaga administrador por esta rota", async () => {
    expect((await del("email=admin@raizconecta.com.br&tipo=admin")).status).toBe(400);
    expect(prismaMock.acesso.deleteMany).not.toHaveBeenCalled();
  });

  it("conta com pedidos ligados devolve 409 explicando", async () => {
    prismaMock.$transaction.mockRejectedValue(Object.assign(new Error("fk"), { code: "P2003" }));
    const response = await del("email=m@x.com&tipo=mercado");

    expect(response.status).toBe(409);
    expect((await response.json()).error).toMatch(/Suspenda/);
    expect(notifyMock).not.toHaveBeenCalled();
  });
});
