import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({ balanca: { findMany: vi.fn() } }));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import { authHeaders } from "@/test-utils/auth";
import * as route from "./route";

const ME = "maria@teste.com";
const row = (deviceId: string, extra = {}) => ({
  id: deviceId, deviceId, nome: "Balança RC-01", apelido: null, vinculadaEm: new Date("2026-10-01T10:00:00Z"), emailProdutor: ME, conectada: false, ...extra,
});

beforeEach(() => vi.clearAllMocks());

describe("GET /api/produtor/balancas", () => {
  it("devolve as balanças do produtor e qual está conectada, no formato do app", async () => {
    prismaMock.balanca.findMany.mockResolvedValue([row("A4CF129B07E2", { conectada: true, vinculadaEm: new Date("2026-10-02T00:00:00Z") }), row("A4CF129B07E1")]);

    const response = await route.GET(new Request("http://x/api/produtor/balancas", { headers: authHeaders(ME, "produtor") }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.activeDeviceId).toBe("A4:CF:12:9B:07:E2");
    expect(body.scales.map((s: { deviceId: string }) => s.deviceId)).toEqual(["A4:CF:12:9B:07:E1", "A4:CF:12:9B:07:E2"]);
    expect(body.scales[0]).toMatchObject({ deviceName: "Balança RC-01", nickname: null });
    expect(JSON.stringify(body)).not.toContain("segredo");
    expect(prismaMock.balanca.findMany.mock.calls[0][0].where.emailProdutor).toEqual({ equals: ME, mode: "insensitive" });
  });

  it("só produtor logado", async () => {
    expect((await route.GET(new Request("http://x/api/produtor/balancas"))).status).toBe(401);
    expect((await route.GET(new Request("http://x/api/produtor/balancas", { headers: authHeaders("m@x.com", "mercado") }))).status).toBe(403);
  });

  it("a balança não entra mais por aqui: só pelo pareamento", () => {
    expect("POST" in route).toBe(false);
  });
});
