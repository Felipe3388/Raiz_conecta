import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({ balanca: { update: vi.fn() } }));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import { authHeaders } from "@/test-utils/auth";
import { hashSecret } from "@/lib/iot/secret";
import { POST } from "./route";

const post = (headers: Record<string, string> = authHeaders("admin@teste.com", "admin"), id = "A4:CF:12:9B:07:E1") =>
  POST(new Request("http://x/api/admin/balancas/x/segredo", { method: "POST", headers }), { params: Promise.resolve({ id }) });

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.balanca.update.mockResolvedValue({});
});

describe("POST /api/admin/balancas/[id]/segredo", () => {
  it("gera um segredo novo e grava só o hash", async () => {
    const response = await post();
    const { segredo } = await response.json();

    expect(response.status).toBe(200);
    expect(segredo).toMatch(/^[0-9a-f]{64}$/);
    expect(prismaMock.balanca.update).toHaveBeenCalledWith({ where: { deviceId: "A4CF129B07E1" }, data: { segredoHash: hashSecret(segredo) } });
  });

  it("balança inexistente: 404", async () => {
    prismaMock.balanca.update.mockRejectedValue({ code: "P2025" });
    expect((await post()).status).toBe(404);
    expect((await post(authHeaders("admin@teste.com", "admin"), "lixo")).status).toBe(404);
  });

  it("só administrador", async () => {
    expect((await post({})).status).toBe(401);
    expect((await post(authHeaders("p@x.com", "produtor"))).status).toBe(403);
  });
});
