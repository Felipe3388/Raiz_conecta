import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({ vendedor: { findFirst: vi.fn() } }));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import { authHeaders } from "@/test-utils/auth";
import { GET } from "./route";

const url = "http://localhost/api/vendedor/perfil";
const ME = "maria@teste.com";

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  prismaMock.vendedor.findFirst.mockResolvedValue({ email: ME, nomeFantasia: "Sítio", status: "APROVADO", telefone: null, cidade: "Votorantim", estado: "SP" });
});

describe("GET /api/vendedor/perfil", () => {
  it("devolve só os dados que a tela usa, do produtor da sessão", async () => {
    const response = await GET(new Request(url, { headers: authHeaders(ME) }));

    expect(response.status).toBe(200);
    expect(prismaMock.vendedor.findFirst).toHaveBeenCalledWith({
      where: { email: ME },
      select: { email: true, nomeFantasia: true, status: true, telefone: true, cidade: true, estado: true },
    });
  });

  it("recusa sem token, de mercado e o e-mail de outra pessoa", async () => {
    expect((await GET(new Request(url))).status).toBe(401);
    expect((await GET(new Request(url, { headers: authHeaders(ME, "mercado") }))).status).toBe(403);
    expect((await GET(new Request(`${url}?email=outra@teste.com`, { headers: authHeaders(ME) }))).status).toBe(403);
    expect(prismaMock.vendedor.findFirst).not.toHaveBeenCalled();
  });

  it("erro do banco vira 500 sem detalhes", async () => {
    prismaMock.vendedor.findFirst.mockRejectedValue(new Error("conexão caiu em db.interno:5432"));
    const response = await GET(new Request(url, { headers: authHeaders(ME) }));

    expect(response.status).toBe(500);
    expect(JSON.stringify(await response.json())).not.toContain("5432");
  });
});
