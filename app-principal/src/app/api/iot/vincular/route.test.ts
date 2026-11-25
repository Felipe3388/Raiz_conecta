import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  pareamentoBalanca: { findUnique: vi.fn(), update: vi.fn() },
  balanca: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
  leituraPeso: { deleteMany: vi.fn() },
  $transaction: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import { generatePairingToken, hashPairingToken } from "@/lib/iot/pairing";
import { hashSecret } from "@/lib/iot/secret";
import { POST } from "./route";

const ME = "maria@teste.com";
const MAC = "A4:CF:12:9B:07:E1";
const TOKEN = generatePairingToken();
let ip = 0;

const pairing = (extra = {}) => ({
  id: "p1", tokenHash: hashPairingToken(TOKEN), emailProdutor: ME, expiraEm: new Date(Date.now() + 60_000), usadoEm: null, deviceId: null, recusa: null, ...extra,
});
const scale = (extra = {}) => ({
  id: "b1", deviceId: "A4CF129B07E1", nome: "Balança RC-07E1", segredoHash: hashSecret("antigo".padEnd(64, "x")), emailProdutor: null, apelido: "Galpão", conectada: false, ...extra,
});
const call = (body: unknown, headers: Record<string, string> = {}, mac = MAC) =>
  POST(new Request("http://x/api/iot/vincular", {
    method: "POST",
    headers: { "content-type": "application/json", "x-device-id": mac, "x-forwarded-for": `10.0.0.${++ip}`, ...headers },
    body: JSON.stringify(body),
  }));

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.$transaction.mockImplementation(async (run: (tx: unknown) => unknown) => run(prismaMock));
  prismaMock.pareamentoBalanca.findUnique.mockResolvedValue(pairing());
  prismaMock.balanca.findUnique.mockResolvedValue(null);
  prismaMock.balanca.updateMany.mockResolvedValue({ count: 1 });
  prismaMock.balanca.create.mockResolvedValue({});
});

describe("POST /api/iot/vincular", () => {
  it("balança nova: registra no nome do produtor, entrega o segredo uma vez e guarda só o hash", async () => {
    const response = await call({ token: TOKEN, firmware: "2.0.0" });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ ok: true, vinculada: true, intervaloAtivoMs: 500, intervaloOciosoMs: 5000, lote: 10 });
    expect(body.segredo).toMatch(/^[0-9a-f]{64}$/);
    expect(response.headers.get("cache-control")).toBe("no-store");

    const created = prismaMock.balanca.create.mock.calls[0][0].data;
    expect(created).toMatchObject({ deviceId: "A4CF129B07E1", nome: "Balança RC-07E1", emailProdutor: ME, firmware: "2.0.0", conectada: false });
    expect(created.segredoHash).toBe(hashSecret(body.segredo));
    expect(JSON.stringify(created)).not.toContain(body.segredo);
    // Depois de registrar, a balança vira a conectada do produtor.
    expect(prismaMock.balanca.updateMany.mock.calls.at(-1)?.[0].data).toEqual({ conectada: true });
    expect(prismaMock.pareamentoBalanca.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "p1" }, data: expect.objectContaining({ deviceId: "A4CF129B07E1", usadoEm: expect.any(Date) }) }),
    );
  });

  it("balança livre (removida pelo dono): vale o novo pareamento e o segredo antigo deixa de valer", async () => {
    prismaMock.balanca.findUnique.mockResolvedValue(scale({ emailProdutor: null }));
    const body = await (await call({ token: TOKEN })).json();

    const claim = prismaMock.balanca.updateMany.mock.calls[0][0];
    expect(claim.where).toEqual({ deviceId: "A4CF129B07E1", emailProdutor: null });
    expect(claim.data).toMatchObject({ emailProdutor: ME, apelido: null, segredoHash: hashSecret(body.segredo) });
    expect(prismaMock.balanca.create).not.toHaveBeenCalled();
  });

  it("mesmo dono (trocou de Wi-Fi): renova o segredo e mantém o apelido", async () => {
    prismaMock.balanca.findUnique.mockResolvedValue(scale({ emailProdutor: "MARIA@teste.com" }));
    const body = await (await call({ token: TOKEN })).json();

    const update = prismaMock.balanca.updateMany.mock.calls[0][0];
    expect(update.data).toEqual({ segredoHash: hashSecret(body.segredo) });
    expect(update.data).not.toHaveProperty("apelido");
  });

  it("balança de outra conta sem prova: 409 e o app é avisado (recusada)", async () => {
    prismaMock.balanca.findUnique.mockResolvedValue(scale({ emailProdutor: "outro@teste.com" }));
    const response = await call({ token: TOKEN });

    expect(response.status).toBe(409);
    expect(JSON.stringify(await response.json())).not.toMatch(/segredo/i);
    expect(prismaMock.balanca.updateMany).not.toHaveBeenCalled();
    expect(prismaMock.pareamentoBalanca.update).toHaveBeenCalledWith(expect.objectContaining({ data: { deviceId: "A4CF129B07E1", recusa: "outra-conta" } }));
  });

  it("segredo errado como prova também recusa", async () => {
    prismaMock.balanca.findUnique.mockResolvedValue(scale({ emailProdutor: "outro@teste.com" }));
    const response = await call({ token: TOKEN }, { authorization: `Device ${"z".repeat(64)}` });
    expect(response.status).toBe(409);
    expect(prismaMock.leituraPeso.deleteMany).not.toHaveBeenCalled();
  });

  it("balança de outra conta com o segredo que só o módulo guarda: troca de dono e apaga o histórico do antigo", async () => {
    const old = "antigo".padEnd(64, "x");
    prismaMock.balanca.findUnique.mockResolvedValue(scale({ emailProdutor: "outro@teste.com", segredoHash: hashSecret(old) }));

    const response = await call({ token: TOKEN }, { authorization: `Device ${old}` });

    expect(response.status).toBe(200);
    expect(prismaMock.leituraPeso.deleteMany).toHaveBeenCalledWith({ where: { balancaId: "b1" } });
    expect(prismaMock.balanca.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "b1" }, data: expect.objectContaining({ emailProdutor: null }) }));
    expect(prismaMock.balanca.updateMany.mock.calls[0][0].data).toMatchObject({ emailProdutor: ME });
  });

  it("token vencido, desconhecido ou fora do formato: mesma resposta 401", async () => {
    prismaMock.pareamentoBalanca.findUnique.mockResolvedValue(pairing({ expiraEm: new Date(Date.now() - 1000) }));
    const expired = await call({ token: TOKEN });
    prismaMock.pareamentoBalanca.findUnique.mockResolvedValue(null);
    const unknown = await call({ token: TOKEN });
    const malformed = await call({ token: "curto" });

    expect([expired.status, unknown.status, malformed.status]).toEqual([401, 401, 401]);
    expect(await expired.json()).toEqual(await unknown.json());
    expect(prismaMock.balanca.create).not.toHaveBeenCalled();
  });

  it("token já usado: o mesmo módulo pode tentar de novo (resposta perdida); outro módulo não", async () => {
    prismaMock.pareamentoBalanca.findUnique.mockResolvedValue(pairing({ usadoEm: new Date(), deviceId: "A4CF129B07E1" }));
    prismaMock.balanca.findUnique.mockResolvedValue(scale({ emailProdutor: ME }));
    expect((await call({ token: TOKEN })).status).toBe(200);

    expect((await call({ token: TOKEN }, {}, "A4:CF:12:9B:07:E2")).status).toBe(401);
  });

  it("endereço do módulo inválido: 400", async () => {
    expect((await call({ token: TOKEN }, {}, "xyz")).status).toBe(400);
    expect(prismaMock.pareamentoBalanca.findUnique).not.toHaveBeenCalled();
  });

  it("muitos tokens errados do mesmo IP travam (429)", async () => {
    prismaMock.pareamentoBalanca.findUnique.mockResolvedValue(null);
    const same = { "x-forwarded-for": "203.0.113.9" };
    for (let i = 0; i < 10; i++) expect((await call({ token: TOKEN }, same)).status).toBe(401);
    const blocked = await call({ token: TOKEN }, same);
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("retry-after")).toBeTruthy();
  });
});
