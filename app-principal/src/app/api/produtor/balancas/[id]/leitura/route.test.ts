import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({ balanca: { findUnique: vi.fn() } }));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import { authHeaders } from "@/test-utils/auth";
import { GET } from "./route";

const ME = "maria@teste.com";
const get = (headers: Record<string, string> = authHeaders(ME, "produtor"), id = "A4:CF:12:9B:07:E1") =>
  GET(new Request("http://x/api/produtor/balancas/x/leitura", { headers }), { params: Promise.resolve({ id }) });
const row = (extra = {}) => ({
  emailProdutor: ME, ultimoContato: new Date(), ultimoKg: 1.25, ultimoEstavel: true, ultimaLeitura: new Date("2026-10-27T12:00:00Z"), ...extra,
});

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.balanca.findUnique.mockResolvedValue(row());
});

describe("GET /api/produtor/balancas/[id]/leitura", () => {
  it("devolve o peso ao vivo e proíbe cache", async () => {
    const response = await get();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ online: true, kg: 1.25, estavel: true, em: new Date("2026-10-27T12:00:00Z").getTime() });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("balança sem contato recente: sem sinal e sem peso (nunca um peso velho)", async () => {
    prismaMock.balanca.findUnique.mockResolvedValue(row({ ultimoContato: new Date(Date.now() - 60_000) }));
    const body = await (await get()).json();

    expect(body).toMatchObject({ online: false, kg: null, estavel: false });
  });

  it("nunca contatou: sem sinal", async () => {
    prismaMock.balanca.findUnique.mockResolvedValue(row({ ultimoContato: null, ultimaLeitura: null }));
    expect(await (await get()).json()).toMatchObject({ online: false, kg: null, em: null });
  });

  it("não deixa ver a balança de outra conta", async () => {
    prismaMock.balanca.findUnique.mockResolvedValue(row({ emailProdutor: "outro@teste.com" }));
    expect((await get()).status).toBe(404);
    prismaMock.balanca.findUnique.mockResolvedValue(null);
    expect((await get()).status).toBe(404);
    expect((await get(authHeaders(ME, "produtor"), "lixo")).status).toBe(404);
  });

  it("só produtor logado", async () => {
    expect((await get({})).status).toBe(401);
    expect((await get(authHeaders("a@x.com", "admin"))).status).toBe(403);
  });
});
