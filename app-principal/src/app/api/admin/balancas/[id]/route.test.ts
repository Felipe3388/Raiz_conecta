import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  balanca: { findUnique: vi.fn(), update: vi.fn(), delete: vi.fn() },
  leituraPeso: { deleteMany: vi.fn() },
  $transaction: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import { authHeaders } from "@/test-utils/auth";
import { DELETE, PATCH } from "./route";

const ADMIN = authHeaders("admin@teste.com", "admin");
const ctx = (id = "A4:CF:12:9B:07:E1") => ({ params: Promise.resolve({ id }) });
const row = (extra = {}) => ({
  id: "b1", deviceId: "A4CF129B07E1", nome: "Balança RC-07E1", emailProdutor: "maria@teste.com", apelido: "Feira", conectada: true,
  firmware: null, ultimoContato: null, ultimoKg: 1, vinculadaEm: new Date(), criadoEm: new Date(), ...extra,
});
const call = (fn: typeof PATCH, body?: unknown, headers: Record<string, string> = ADMIN, id?: string) =>
  fn(new Request("http://x/api/admin/balancas/x", { method: "PATCH", headers, body: body === undefined ? undefined : JSON.stringify(body) }), ctx(id));

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.balanca.findUnique.mockResolvedValue(row());
  prismaMock.balanca.update.mockResolvedValue({});
  prismaMock.balanca.delete.mockResolvedValue({});
  prismaMock.leituraPeso.deleteMany.mockResolvedValue({ count: 0 });
  prismaMock.$transaction.mockImplementation(async (run: (tx: unknown) => unknown) => run(prismaMock));
});

describe("PATCH /api/admin/balancas/[id]", () => {
  it("libera a balança do produtor", async () => {
    const response = await call(PATCH, { liberar: true });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ emailProdutor: null, conectada: false, apelido: null });
    expect(prismaMock.leituraPeso.deleteMany).toHaveBeenCalledWith({ where: { balancaId: "b1" } });
  });

  it("valida o corpo e a existência", async () => {
    expect((await call(PATCH, {})).status).toBe(400);
    expect((await call(PATCH, { liberar: "sim" })).status).toBe(400);
    prismaMock.balanca.findUnique.mockResolvedValue(null);
    expect((await call(PATCH, { liberar: true })).status).toBe(404);
    expect((await call(PATCH, { liberar: true }, ADMIN, "lixo")).status).toBe(404);
  });

  it("só administrador", async () => {
    expect((await call(PATCH, { liberar: true }, {})).status).toBe(401);
    expect((await call(PATCH, { liberar: true }, authHeaders("p@x.com", "produtor"))).status).toBe(403);
  });
});

describe("DELETE /api/admin/balancas/[id]", () => {
  it("apaga a balança", async () => {
    expect((await call(DELETE)).status).toBe(200);
    expect(prismaMock.balanca.delete).toHaveBeenCalledWith({ where: { deviceId: "A4CF129B07E1" } });
  });

  it("não existe: 404", async () => {
    prismaMock.balanca.delete.mockRejectedValue({ code: "P2025" });
    expect((await call(DELETE)).status).toBe(404);
  });

  it("só administrador", async () => {
    expect((await call(DELETE, undefined, authHeaders("p@x.com", "produtor"))).status).toBe(403);
  });
});
