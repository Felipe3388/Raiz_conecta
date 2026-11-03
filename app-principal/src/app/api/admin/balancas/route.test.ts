import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({ balanca: { findMany: vi.fn(), create: vi.fn() } }));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import { authHeaders } from "@/test-utils/auth";
import { hashSecret } from "@/lib/iot/secret";
import { GET, POST } from "./route";

const ADMIN = authHeaders("admin@teste.com", "admin");
const row = (extra = {}) => ({
  id: "b1", deviceId: "A4CF129B07E1", nome: "Balança RC-07E1", segredoHash: "hash-secreto", emailProdutor: null, apelido: null, conectada: false,
  firmware: null, ultimoContato: null, ultimoKg: null, vinculadaEm: null, criadoEm: new Date("2026-10-01T00:00:00Z"), ...extra,
});
const post = (body: unknown, headers: Record<string, string> = ADMIN) =>
  POST(new Request("http://x/api/admin/balancas", { method: "POST", headers, body: JSON.stringify(body) }));

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.balanca.create.mockImplementation(async ({ data }: { data: object }) => row(data));
});

describe("GET /api/admin/balancas", () => {
  it("lista com o código da etiqueta, sinal e dono — sem o hash do segredo", async () => {
    prismaMock.balanca.findMany.mockResolvedValue([row({ emailProdutor: "maria@teste.com", ultimoContato: new Date(), conectada: true })]);

    const response = await GET(new Request("http://x/api/admin/balancas", { headers: ADMIN }));
    const [item] = await response.json();

    expect(response.status).toBe(200);
    expect(item).toMatchObject({ deviceId: "A4:CF:12:9B:07:E1", emailProdutor: "maria@teste.com", online: true, conectada: true });
    expect(item.codigo).toMatch(/^[0-9A-Z]{4}-[0-9A-Z]{4}$/);
    expect(JSON.stringify(item)).not.toMatch(/segredo|hash-secreto/);
  });

  it("só administrador", async () => {
    expect((await GET(new Request("http://x/api/admin/balancas"))).status).toBe(401);
    expect((await GET(new Request("http://x/api/admin/balancas", { headers: authHeaders("p@x.com", "produtor") }))).status).toBe(403);
  });
});

describe("POST /api/admin/balancas", () => {
  it("cadastra, devolve o segredo uma única vez e guarda só o hash", async () => {
    const response = await post({ deviceId: "a4-cf-12-9b-07-e1" });
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.segredo).toMatch(/^[0-9a-f]{64}$/);
    expect(body.balanca).toMatchObject({ deviceId: "A4:CF:12:9B:07:E1", nome: "Balança RC-07E1" });
    expect(JSON.stringify(body.balanca)).not.toContain(body.segredo);
    const saved = prismaMock.balanca.create.mock.calls[0][0].data;
    expect(saved).toMatchObject({ deviceId: "A4CF129B07E1", segredoHash: hashSecret(body.segredo) });
    expect(Object.values(saved)).not.toContain(body.segredo);
  });

  it("aceita um nome de fábrica (até 30 letras)", async () => {
    const body = await (await post({ deviceId: "A4CF129B07E1", nome: "Balança Feira ".repeat(5) })).json();
    expect(body.balanca.nome.length).toBeLessThanOrEqual(30);
  });

  it("MAC repetido: 409", async () => {
    prismaMock.balanca.create.mockRejectedValue({ code: "P2002" });
    expect((await post({ deviceId: "A4CF129B07E1" })).status).toBe(409);
  });

  it("MAC inválido: 400", async () => {
    expect((await post({ deviceId: "123" })).status).toBe(400);
    expect((await post({})).status).toBe(400);
  });

  it("só administrador", async () => {
    expect((await post({ deviceId: "A4CF129B07E1" }, {})).status).toBe(401);
    expect((await post({ deviceId: "A4CF129B07E1" }, authHeaders("m@x.com", "mercado"))).status).toBe(403);
  });
});
