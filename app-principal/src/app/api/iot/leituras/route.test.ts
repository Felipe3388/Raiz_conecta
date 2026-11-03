import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  balanca: { findUnique: vi.fn(), update: vi.fn() },
  leituraPeso: { createMany: vi.fn(), deleteMany: vi.fn() },
  $transaction: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import { hashSecret } from "@/lib/iot/secret";
import { POST } from "./route";

const SECRET = "s".repeat(64);
const MAC = "A4:CF:12:9B:07:E1";
const balanca = (extra = {}) => ({ id: "b1", deviceId: "A4CF129B07E1", segredoHash: hashSecret(SECRET), emailProdutor: "maria@teste.com", ultimoKg: null, ultimoEstavel: false, ...extra });
const post = (body: unknown, headers: Record<string, string> = { "x-device-id": MAC, authorization: `Device ${SECRET}` }) =>
  POST(new Request("http://x/api/iot/leituras", { method: "POST", headers, body: JSON.stringify(body) }));

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.balanca.findUnique.mockResolvedValue(balanca());
  prismaMock.balanca.update.mockResolvedValue({});
  prismaMock.leituraPeso.createMany.mockResolvedValue({ count: 1 });
  prismaMock.leituraPeso.deleteMany.mockResolvedValue({ count: 0 });
  prismaMock.$transaction.mockImplementation(async (steps: Promise<unknown>[]) => Promise.all(steps));
});

describe("POST /api/iot/leituras", () => {
  it("guarda a última leitura, o contato e o peso estável", async () => {
    const response = await post({ firmware: "1.2.0", leituras: [{ kg: 0.4 }, { kg: 1.25, estavel: true }] });

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ok: true, vinculada: true, hora: expect.any(Number) });
    const update = prismaMock.balanca.update.mock.calls[0][0];
    expect(update.where).toEqual({ id: "b1" });
    expect(update.data).toMatchObject({ firmware: "1.2.0", ultimoKg: 1.25, ultimoEstavel: true });
    expect(update.data.ultimoContato).toBeInstanceOf(Date);
    expect(prismaMock.leituraPeso.createMany.mock.calls[0][0].data).toEqual([expect.objectContaining({ balancaId: "b1", kg: 1.25 })]);
    expect(prismaMock.leituraPeso.deleteMany).toHaveBeenCalledOnce();
  });

  it("lista vazia é só batimento: atualiza o contato e nada mais", async () => {
    const response = await post({ leituras: [] });

    expect(response.status).toBe(200);
    expect(prismaMock.balanca.update.mock.calls[0][0].data).not.toHaveProperty("ultimoKg");
    expect(prismaMock.leituraPeso.createMany).not.toHaveBeenCalled();
  });

  it("não guarda de novo o peso estável que já tinha guardado", async () => {
    prismaMock.balanca.findUnique.mockResolvedValue(balanca({ ultimoKg: 1.25, ultimoEstavel: true }));
    await post({ leituras: [{ kg: 1.25, estavel: true }] });
    expect(prismaMock.leituraPeso.createMany).not.toHaveBeenCalled();
  });

  it("balança sem dono avisa que está viva mas não gera histórico", async () => {
    prismaMock.balanca.findUnique.mockResolvedValue(balanca({ emailProdutor: null }));
    const response = await post({ leituras: [{ kg: 2, estavel: true }] });

    expect((await response.json()).vinculada).toBe(false);
    expect(prismaMock.leituraPeso.createMany).not.toHaveBeenCalled();
  });

  it("recusa módulo sem credencial, com segredo errado ou desconhecido (sempre 401 igual)", async () => {
    const cases: Record<string, string>[] = [
      {},
      { "x-device-id": MAC },
      { "x-device-id": MAC, authorization: "Device errado" },
      { "x-device-id": MAC, authorization: `Bearer ${SECRET}` },
      { "x-device-id": "nada", authorization: `Device ${SECRET}` },
    ];
    for (const headers of cases) {
      const response = await post({ leituras: [] }, headers);
      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ error: "Balança não autorizada." });
    }
    prismaMock.balanca.findUnique.mockResolvedValue(null);
    expect((await post({ leituras: [] })).status).toBe(401);
    expect(prismaMock.balanca.update).not.toHaveBeenCalled();
  });

  it("token de usuário não serve de credencial de balança", async () => {
    const response = await post({ leituras: [] }, { "x-device-id": MAC, authorization: "Bearer algum.jwt.token" });
    expect(response.status).toBe(401);
  });

  it("recusa leitura inválida com 400", async () => {
    expect((await post({ leituras: [{ kg: "1" }] })).status).toBe(400);
    expect((await post({ leituras: [{ kg: 9999 }] })).status).toBe(400);
    expect((await post({})).status).toBe(400);
    expect(prismaMock.balanca.update).not.toHaveBeenCalled();
  });

  it("erro do banco vira 500 sem detalhes", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    prismaMock.$transaction.mockRejectedValue(new Error("connection refused"));
    const response = await post({ leituras: [] });

    expect(response.status).toBe(500);
    expect(JSON.stringify(await response.json())).not.toContain("connection");
  });
});
