import bcrypt from "bcryptjs";
import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  acesso: { findFirst: vi.fn() },
  vendedor: { findFirst: vi.fn() },
  cliente: { findFirst: vi.fn() },
}));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import { verifyToken } from "@/lib/auth/jwt";
import { POST } from "./app-principal/src/app/api/auth/login/route";

const HASH = bcrypt.hashSync("Senha@123", 4);
let ipCounter = 0;
const login = (body: unknown, ip = `10.0.0.${++ipCounter}`) =>
  POST(new Request("http://x/api/auth/login", { method: "POST", headers: { "x-forwarded-for": ip }, body: JSON.stringify(body) }));

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.acesso.findFirst.mockResolvedValue({ login: "maria@teste.com", hash: HASH, tipoUser: "produtor", status: "APROVADO" });
  prismaMock.vendedor.findFirst.mockResolvedValue({ nomeFantasia: "Sítio Boa Vista" });
});

describe("POST /api/auth/login", () => {
  it("entra com a senha certa: token assinado, cookie httpOnly e o e-mail gravado no banco", async () => {
    const response = await login({ email: "MARIA@teste.com", senha: "Senha@123" });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.user).toEqual({ email: "maria@teste.com", tipoUser: "produtor", nome: "Sítio Boa Vista", status: "APROVADO" });
    expect(await verifyToken(data.token)).toMatchObject({ email: "maria@teste.com", role: "produtor" });
    const cookie = response.headers.get("set-cookie") ?? "";
    expect(cookie).toContain("token=");
    expect(cookie.toLowerCase()).toContain("httponly");
    expect(prismaMock.acesso.findFirst).toHaveBeenCalledWith({ where: { login: { equals: "MARIA@teste.com", mode: "insensitive" } } });
  });

  it("recusa senha errada e e-mail desconhecido com a mesma mensagem", async () => {
    const wrong = await login({ email: "maria@teste.com", senha: "Outra@123" });
    prismaMock.acesso.findFirst.mockResolvedValue(null);
    const unknown = await login({ email: "ninguem@teste.com", senha: "Senha@123" });

    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect((await wrong.json()).error).toBe((await unknown.json()).error);
  });

  it("exige e-mail e senha", async () => {
    expect((await login({ email: "maria@teste.com" })).status).toBe(400);
    expect((await login({})).status).toBe(400);
    expect((await login("quebrado")).status).toBe(400);
  });

  it("bloqueia contas suspensas ou rejeitadas", async () => {
    prismaMock.acesso.findFirst.mockResolvedValue({ login: "maria@teste.com", hash: HASH, tipoUser: "produtor", status: "SUSPENSO" });
    expect((await login({ email: "maria@teste.com", senha: "Senha@123" })).status).toBe(403);
  });

  it("depois de 5 senhas erradas seguidas trava a tentativa seguinte (429)", async () => {
    const ip = "9.9.9.9";
    for (let i = 0; i < 5; i++) expect((await login({ email: "maria@teste.com", senha: "errada" }, ip)).status).toBe(401);

    const blocked = await login({ email: "maria@teste.com", senha: "Senha@123" }, ip);
    expect(blocked.status).toBe(429);
    expect(Number(blocked.headers.get("retry-after"))).toBeGreaterThan(0);
  });

  it("administrador entra sem consultar perfil de produtor ou mercado", async () => {
    prismaMock.acesso.findFirst.mockResolvedValue({ login: "admin@raizconecta.com.br", hash: HASH, tipoUser: "admin", status: "APROVADO" });
    const data = await (await login({ email: "admin@raizconecta.com.br", senha: "Senha@123" })).json();

    expect(data.user.nome).toBe("Administrador");
    expect(prismaMock.vendedor.findFirst).not.toHaveBeenCalled();
    expect(prismaMock.cliente.findFirst).not.toHaveBeenCalled();
  });
});
