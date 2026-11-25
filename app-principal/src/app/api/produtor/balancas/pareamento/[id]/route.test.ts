import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({ pareamentoBalanca: { findUnique: vi.fn() }, balanca: { findUnique: vi.fn() } }));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import { authHeaders } from "@/test-utils/auth";
import { GET } from "./route";

const ME = "maria@teste.com";
const ctx = { params: Promise.resolve({ id: "p1" }) };
const get = (email = ME, role: "produtor" | "mercado" = "produtor") =>
  GET(new Request("http://x/api/produtor/balancas/pareamento/p1", { headers: authHeaders(email, role) }), ctx);
const open = (extra = {}) => ({ id: "p1", emailProdutor: ME, expiraEm: new Date(Date.now() + 60_000), usadoEm: null, deviceId: null, recusa: null, ...extra });
const scale = (extra = {}) => ({
  id: "b1", deviceId: "A4CF129B07E1", nome: "Balança RC-07E1", apelido: null, vinculadaEm: new Date(), emailProdutor: ME, conectada: true, ultimoContato: new Date(), ...extra,
});

beforeEach(() => vi.clearAllMocks());

describe("GET /api/produtor/balancas/pareamento/{id}", () => {
  it("aguardando: a balança ainda não falou com o servidor", async () => {
    prismaMock.pareamentoBalanca.findUnique.mockResolvedValue(open());
    const response = await get();
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ estado: "aguardando", pronta: false, balanca: null });
    expect(prismaMock.balanca.findUnique).not.toHaveBeenCalled();
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("vinculada e pronta: devolve a balança no formato do app", async () => {
    prismaMock.pareamentoBalanca.findUnique.mockResolvedValue(open({ usadoEm: new Date(), deviceId: "A4CF129B07E1" }));
    prismaMock.balanca.findUnique.mockResolvedValue(scale());
    const body = await (await get()).json();
    expect(body).toMatchObject({ estado: "vinculada", pronta: true, deviceId: "A4:CF:12:9B:07:E1" });
    expect(body.balanca).toMatchObject({ deviceName: "Balança RC-07E1", nickname: null });
    expect(JSON.stringify(body)).not.toMatch(/segredo/i);
  });

  it("recusada: explica que a balança é de outra conta", async () => {
    prismaMock.pareamentoBalanca.findUnique.mockResolvedValue(open({ recusa: "outra-conta", deviceId: "A4CF129B07E1" }));
    expect(await (await get()).json()).toMatchObject({ estado: "recusada", mensagem: expect.stringMatching(/outra conta/) });
  });

  it("pareamento de outro produtor ou inexistente: mesma resposta 404", async () => {
    prismaMock.pareamentoBalanca.findUnique.mockResolvedValue(open({ emailProdutor: "outro@teste.com" }));
    const other = await get();
    prismaMock.pareamentoBalanca.findUnique.mockResolvedValue(null);
    const missing = await get();
    expect(other.status).toBe(404);
    expect(missing.status).toBe(404);
    expect(await other.json()).toEqual(await missing.json());
  });

  it("só produtor logado", async () => {
    expect((await GET(new Request("http://x/p"), ctx)).status).toBe(401);
    expect((await get("m@x.com", "mercado")).status).toBe(403);
  });
});
