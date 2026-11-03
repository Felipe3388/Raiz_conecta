import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  balanca: { findMany: vi.fn(), findUnique: vi.fn(), updateMany: vi.fn() },
  $transaction: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import { authHeaders } from "@/test-utils/auth";
import { formatCode, pairingCode } from "@/lib/iot/pairing";
import { GET, POST } from "./route";

const ME = "maria@teste.com";
const row = (deviceId: string, extra = {}) => ({
  id: deviceId, deviceId, nome: "Balança RC-01", apelido: null, vinculadaEm: new Date("2026-10-01T10:00:00Z"), emailProdutor: ME, conectada: false, ...extra,
});
const post = (body: unknown, headers: Record<string, string> = authHeaders(ME, "produtor")) =>
  POST(new Request("http://x/api/produtor/balancas", { method: "POST", headers, body: JSON.stringify(body) }));
const CODE = formatCode(pairingCode("A4CF129B07E1"));

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.$transaction.mockImplementation(async (run: (tx: unknown) => unknown) => run(prismaMock));
  prismaMock.balanca.updateMany.mockResolvedValue({ count: 1 });
});

describe("GET /api/produtor/balancas", () => {
  it("devolve as balanças do produtor e qual está conectada, no formato do app", async () => {
    prismaMock.balanca.findMany.mockResolvedValue([row("A4CF129B07E2", { conectada: true, vinculadaEm: new Date("2026-10-02T00:00:00Z") }), row("A4CF129B07E1")]);

    const response = await GET(new Request("http://x/api/produtor/balancas", { headers: authHeaders(ME, "produtor") }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.activeDeviceId).toBe("A4:CF:12:9B:07:E2");
    expect(body.scales.map((s: { deviceId: string }) => s.deviceId)).toEqual(["A4:CF:12:9B:07:E1", "A4:CF:12:9B:07:E2"]);
    expect(body.scales[0]).toMatchObject({ deviceName: "Balança RC-01", nickname: null });
    expect(JSON.stringify(body)).not.toContain("segredo");
    expect(prismaMock.balanca.findMany.mock.calls[0][0].where.emailProdutor).toEqual({ equals: ME, mode: "insensitive" });
  });

  it("só produtor logado", async () => {
    expect((await GET(new Request("http://x/api/produtor/balancas"))).status).toBe(401);
    expect((await GET(new Request("http://x/api/produtor/balancas", { headers: authHeaders("m@x.com", "mercado") }))).status).toBe(403);
  });
});

describe("POST /api/produtor/balancas", () => {
  it("vincula a balança livre com o código da etiqueta e a deixa conectada", async () => {
    prismaMock.balanca.findUnique.mockResolvedValue(row("A4CF129B07E1", { emailProdutor: null, vinculadaEm: null }));

    const response = await post({ deviceId: "a4:cf:12:9b:07:e1", codigo: CODE.toLowerCase() });
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toMatchObject({ deviceId: "A4:CF:12:9B:07:E1", deviceName: "Balança RC-01", nickname: null });
    expect(body.key).toMatch(/^RC-/);
    expect(prismaMock.balanca.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { deviceId: "A4CF129B07E1", emailProdutor: null }, data: expect.objectContaining({ emailProdutor: ME, conectada: false }) }),
    );
    // Depois de tomar a balança, desconecta as outras e conecta esta.
    expect(prismaMock.balanca.updateMany.mock.calls.at(-1)?.[0].data).toEqual({ conectada: true });
  });

  it("código errado ou balança que não existe: mesma resposta 404", async () => {
    prismaMock.balanca.findUnique.mockResolvedValue(row("A4CF129B07E1", { emailProdutor: null }));
    const wrong = await post({ deviceId: "A4CF129B07E1", codigo: "0000-0000" });
    prismaMock.balanca.findUnique.mockResolvedValue(null);
    const missing = await post({ deviceId: "A4CF129B07E1", codigo: CODE });

    expect(wrong.status).toBe(404);
    expect(missing.status).toBe(404);
    expect(await wrong.json()).toEqual(await missing.json());
    expect(prismaMock.balanca.updateMany).not.toHaveBeenCalled();
  });

  it("balança de outra conta: 409 (só para quem tem o código da etiqueta)", async () => {
    prismaMock.balanca.findUnique.mockResolvedValue(row("A4CF129B07E1", { emailProdutor: "outro@teste.com" }));

    expect((await post({ deviceId: "A4CF129B07E1", codigo: CODE })).status).toBe(409);
    // Sem o código certo não revela que ela existe nem de quem é.
    expect((await post({ deviceId: "A4CF129B07E1", codigo: "0000-0000" })).status).toBe(404);
  });

  it("perde a disputa se outra conta levou a balança no meio do caminho", async () => {
    prismaMock.balanca.findUnique.mockResolvedValue(row("A4CF129B07E1", { emailProdutor: null }));
    prismaMock.balanca.updateMany.mockResolvedValueOnce({ count: 0 });

    expect((await post({ deviceId: "A4CF129B07E1", codigo: CODE })).status).toBe(409);
  });

  it("adicionar de novo uma balança que já é sua só a deixa conectada (sem pedir código)", async () => {
    prismaMock.balanca.findUnique.mockResolvedValue(row("A4CF129B07E1"));

    const response = await post({ deviceId: "A4CF129B07E1" });

    expect(response.status).toBe(200);
    expect((await response.json()).deviceId).toBe("A4:CF:12:9B:07:E1");
    expect(prismaMock.balanca.updateMany).toHaveBeenCalledTimes(2);
  });

  it("valida a identificação e pede o código", async () => {
    expect((await post({ deviceId: "nada", codigo: CODE })).status).toBe(400);
    expect((await post({ codigo: CODE })).status).toBe(400);
    prismaMock.balanca.findUnique.mockResolvedValue(row("A4CF129B07E1", { emailProdutor: null }));
    expect((await post({ deviceId: "A4CF129B07E1" })).status).toBe(400);
  });

  it("trava quem fica chutando o código", async () => {
    prismaMock.balanca.findUnique.mockResolvedValue(row("A4CF129B07E1", { emailProdutor: null }));
    const chutador = "chuta@teste.com";
    const headers = authHeaders(chutador, "produtor");
    for (let i = 0; i < 8; i++) expect((await post({ deviceId: "A4CF129B07E1", codigo: "0000-0000" }, headers)).status).toBe(404);

    const blocked = await post({ deviceId: "A4CF129B07E1", codigo: CODE }, headers);
    expect(blocked.status).toBe(429);
    expect(Number(blocked.headers.get("Retry-After"))).toBeGreaterThan(0);
  });

  it("só produtor logado", async () => {
    expect((await post({ deviceId: "A4CF129B07E1", codigo: CODE }, {})).status).toBe(401);
    expect((await post({ deviceId: "A4CF129B07E1", codigo: CODE }, authHeaders("m@x.com", "mercado"))).status).toBe(403);
  });
});
