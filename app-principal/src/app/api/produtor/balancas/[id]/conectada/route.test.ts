import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({ balanca: { updateMany: vi.fn() }, $transaction: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import { authHeaders } from "@/test-utils/auth";
import { PUT } from "./route";

const ME = "maria@teste.com";
const put = (headers: Record<string, string> = authHeaders(ME, "produtor"), id = "A4:CF:12:9B:07:E2") =>
  PUT(new Request("http://x/api/produtor/balancas/x/conectada", { method: "PUT", headers }), { params: Promise.resolve({ id }) });

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.balanca.updateMany.mockResolvedValue({ count: 1 });
  prismaMock.$transaction.mockImplementation(async (run: (tx: unknown) => unknown) => run(prismaMock));
});

describe("PUT /api/produtor/balancas/[id]/conectada", () => {
  it("desconecta as outras do produtor e conecta esta", async () => {
    const response = await put();

    expect(response.status).toBe(200);
    const [off, on] = prismaMock.balanca.updateMany.mock.calls.map((c) => c[0]);
    expect(off).toEqual({ where: { emailProdutor: { equals: ME, mode: "insensitive" }, conectada: true, NOT: { deviceId: "A4CF129B07E2" } }, data: { conectada: false } });
    expect(on).toEqual({ where: { deviceId: "A4CF129B07E2", emailProdutor: { equals: ME, mode: "insensitive" } }, data: { conectada: true } });
  });

  it("balança que não é dele: 404", async () => {
    prismaMock.balanca.updateMany.mockResolvedValueOnce({ count: 0 }).mockResolvedValueOnce({ count: 0 });
    expect((await put()).status).toBe(404);
    expect((await put(authHeaders(ME, "produtor"), "lixo")).status).toBe(404);
  });

  it("só produtor logado", async () => {
    expect((await put({})).status).toBe(401);
    expect((await put(authHeaders("m@x.com", "mercado"))).status).toBe(403);
  });
});
