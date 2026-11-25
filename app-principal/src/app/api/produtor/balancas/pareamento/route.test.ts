import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  pareamentoBalanca: { deleteMany: vi.fn(), create: vi.fn() },
  $transaction: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import { authHeaders } from "@/test-utils/auth";
import { hashPairingToken, isPairingTokenFormat } from "@/lib/iot/pairing";

const post = async (email: string, role: "produtor" | "mercado" = "produtor") => {
  // Cada teste importa a rota de novo para começar com o limitador zerado.
  const { POST } = await import("./route");
  return POST(new Request("http://x/api/produtor/balancas/pareamento", { method: "POST", headers: authHeaders(email, role) }));
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
  prismaMock.pareamentoBalanca.deleteMany.mockResolvedValue({ count: 0 });
  prismaMock.pareamentoBalanca.create.mockImplementation(async ({ data }: { data: object }) => ({ id: "p1", ...data }));
  prismaMock.$transaction.mockImplementation(async (ops: Promise<unknown>[]) => Promise.all(ops));
});

describe("POST /api/produtor/balancas/pareamento", () => {
  it("abre um pareamento: devolve o token uma vez e guarda só o hash", async () => {
    const response = await post("maria@teste.com");
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.id).toBe("p1");
    expect(isPairingTokenFormat(body.token)).toBe(true);
    expect(new Date(body.expiraEm).getTime()).toBeGreaterThan(Date.now());
    expect(response.headers.get("cache-control")).toBe("no-store");

    const saved = prismaMock.pareamentoBalanca.create.mock.calls[0][0].data;
    expect(saved).toMatchObject({ tokenHash: hashPairingToken(body.token), emailProdutor: "maria@teste.com" });
    expect(JSON.stringify(saved)).not.toContain(body.token);
  });

  it("descarta os pedidos anteriores que ninguém usou (um pareamento aberto por produtor)", async () => {
    await post("maria@teste.com");
    const where = prismaMock.pareamentoBalanca.deleteMany.mock.calls[0][0].where;
    expect(where.OR[0]).toEqual({ emailProdutor: { equals: "maria@teste.com", mode: "insensitive" }, usadoEm: null });
  });

  it("trava depois de muitos pedidos seguidos", async () => {
    const { POST } = await import("./route");
    const call = () => POST(new Request("http://x/api/produtor/balancas/pareamento", { method: "POST", headers: authHeaders("limite@teste.com", "produtor") }));
    for (let i = 0; i < 10; i++) expect((await call()).status).toBe(201);
    const blocked = await call();
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("retry-after")).toBeTruthy();
  });

  it("só produtor logado", async () => {
    const { POST } = await import("./route");
    expect((await POST(new Request("http://x/api/produtor/balancas/pareamento", { method: "POST" }))).status).toBe(401);
    expect((await post("m@x.com", "mercado")).status).toBe(403);
  });
});
