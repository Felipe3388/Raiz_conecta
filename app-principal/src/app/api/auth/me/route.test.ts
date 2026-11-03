import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  acesso: { findFirst: vi.fn() },
  vendedor: { findFirst: vi.fn() },
  cliente: { findFirst: vi.fn() },
}));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import { authHeaders } from "@/test-utils/auth";
import { GET } from "./route";

const url = "http://localhost/api/auth/me";

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.vendedor.findFirst.mockResolvedValue(null);
  prismaMock.cliente.findFirst.mockResolvedValue(null);
});

describe("GET /api/auth/me", () => {
  it("devolve quem está logado, com a situação da conta lida do banco", async () => {
    prismaMock.acesso.findFirst.mockResolvedValue({ status: "APROVADO" });

    const response = await GET(new Request(url, { headers: authHeaders("maria@teste.com") }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ email: "maria@teste.com", role: "produtor", nome: "Teste", status: "APROVADO" });
  });

  it("o nome é o de agora (trocado no perfil), não o do token", async () => {
    prismaMock.acesso.findFirst.mockResolvedValue({ status: "APROVADO" });
    prismaMock.vendedor.findFirst.mockResolvedValue({ nomeFantasia: "Sítio Novo" });
    expect((await (await GET(new Request(url, { headers: authHeaders("p@teste.com", "produtor") }))).json()).nome).toBe("Sítio Novo");

    prismaMock.cliente.findFirst.mockResolvedValue({ nomeFantasia: "Mercado Novo" });
    expect((await (await GET(new Request(url, { headers: authHeaders("m@teste.com", "mercado") }))).json()).nome).toBe("Mercado Novo");
    expect(prismaMock.vendedor.findFirst).toHaveBeenCalledTimes(1);

    const admin = await GET(new Request(url, { headers: authHeaders("a@teste.com", "admin") }));
    expect((await admin.json()).nome).toBe("Teste");
  });

  it("nunca guarda a resposta em cache", async () => {
    prismaMock.acesso.findFirst.mockResolvedValue({ status: "APROVADO" });
    const response = await GET(new Request(url, { headers: authHeaders() }));
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("sem token ou com a conta apagada, a sessão acabou (401)", async () => {
    expect((await GET(new Request(url))).status).toBe(401);
    prismaMock.acesso.findFirst.mockResolvedValue(null);
    expect((await GET(new Request(url, { headers: authHeaders() }))).status).toBe(401);
  });
});
