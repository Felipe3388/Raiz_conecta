import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({ balanca: { findMany: vi.fn() } }));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import { authHeaders } from "@/test-utils/auth";
import { GET } from "./route";

const ADMIN = authHeaders("admin@teste.com", "admin");
const row = (extra = {}) => ({
  id: "b1", deviceId: "A4CF129B07E1", nome: "Balança RC-07E1", segredoHash: "hash-secreto", emailProdutor: null, apelido: null, conectada: false,
  firmware: null, ultimoContato: null, ultimoKg: null, vinculadaEm: null, criadoEm: new Date("2026-10-01T00:00:00Z"), ...extra,
});

beforeEach(() => vi.clearAllMocks());

describe("GET /api/admin/balancas", () => {
  it("lista com sinal e dono, sem o hash do segredo nem código de etiqueta", async () => {
    prismaMock.balanca.findMany.mockResolvedValue([row({ emailProdutor: "maria@teste.com", ultimoContato: new Date(), conectada: true })]);

    const response = await GET(new Request("http://x/api/admin/balancas", { headers: ADMIN }));
    const [item] = await response.json();

    expect(response.status).toBe(200);
    expect(item).toMatchObject({ deviceId: "A4:CF:12:9B:07:E1", emailProdutor: "maria@teste.com", online: true, conectada: true });
    expect(item).not.toHaveProperty("codigo");
    expect(JSON.stringify(item)).not.toMatch(/segredo|hash-secreto/);
  });

  it("só administrador", async () => {
    expect((await GET(new Request("http://x/api/admin/balancas"))).status).toBe(401);
    expect((await GET(new Request("http://x/api/admin/balancas", { headers: authHeaders("p@x.com", "produtor") }))).status).toBe(403);
  });
});
