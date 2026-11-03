import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({ acesso: { findFirst: vi.fn(), create: vi.fn() } }));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import { authHeaders } from "@/test-utils/auth";
import { POST } from "./route";

const ADMIN = authHeaders("admin@x.com", "admin");
const post = (body: unknown, headers: Record<string, string> = ADMIN) =>
  POST(new Request("http://x/api/admin/novo-admin", { method: "POST", headers, body: JSON.stringify(body) }));

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.acesso.findFirst.mockResolvedValue(null);
});

describe("POST /api/admin/novo-admin", () => {
  it("só administrador logado cria administrador", async () => {
    expect((await post({ email: "a@b.com", senha: "Senha@123" }, {})).status).toBe(401);
    expect((await post({ email: "a@b.com", senha: "Senha@123" }, authHeaders("m@x.com", "mercado"))).status).toBe(403);
    expect(prismaMock.acesso.create).not.toHaveBeenCalled();
  });

  it("cria com a senha criptografada e o e-mail em minúsculas", async () => {
    const response = await post({ email: "Novo@Raiz.com", senha: "Senha@123" });

    expect(response.status).toBe(201);
    const { data } = prismaMock.acesso.create.mock.calls[0][0];
    expect(data).toMatchObject({ login: "novo@raiz.com", tipoUser: "admin", status: "APROVADO" });
    expect(data.hash).not.toBe("Senha@123");
  });

  it("exige senha forte e e-mail válido, e barra e-mail repetido", async () => {
    expect((await post({ email: "novo@raiz.com", senha: "fraca" })).status).toBe(400);
    expect((await post({ email: "novo", senha: "Senha@123" })).status).toBe(400);
    prismaMock.acesso.findFirst.mockResolvedValue({ id: 1 });
    expect((await post({ email: "novo@raiz.com", senha: "Senha@123" })).status).toBe(409);
  });
});
