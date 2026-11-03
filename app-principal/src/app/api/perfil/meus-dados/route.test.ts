import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  acesso: { findFirst: vi.fn(), updateMany: vi.fn(), deleteMany: vi.fn() },
  vendedor: { findUnique: vi.fn(), update: vi.fn(), delete: vi.fn() },
  cliente: { findUnique: vi.fn(), update: vi.fn(), delete: vi.fn() },
  $transaction: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import bcrypt from "bcryptjs";
import { authHeaders } from "@/test-utils/auth";
import { DELETE, GET, PUT } from "./route";

const url = "http://localhost/api/perfil/meus-dados";
const ME = "maria@teste.com";

const put = (body: unknown, headers: Record<string, string> = authHeaders(ME)) =>
  PUT(new Request(url, { method: "PUT", headers, body: JSON.stringify(body) }));

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.acesso.findFirst.mockResolvedValue({ tipoUser: "produtor", cdVendedor: 1 });
  prismaMock.vendedor.findUnique.mockResolvedValue({ email: ME, nomeFantasia: "Sítio", senha: "segredo-antigo", urlDocumento: "https://res.cloudinary.com/x/doc.jpg" });
  prismaMock.$transaction.mockImplementation((writes: Promise<unknown>[]) => Promise.all(writes));
});

describe("GET /api/perfil/meus-dados", () => {
  it("devolve os dados do próprio usuário, sem a senha nem o documento enviado", async () => {
    const response = await GET(new Request(url, { headers: authHeaders(ME) }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ email: ME, nomeFantasia: "Sítio", tipoUser: "produtor" });
  });

  it("recusa sem token e o e-mail de outra pessoa", async () => {
    expect((await GET(new Request(url))).status).toBe(401);
    const other = await GET(new Request(`${url}?email=outra@teste.com`, { headers: authHeaders(ME) }));
    expect(other.status).toBe(403);
    expect(prismaMock.vendedor.findUnique).not.toHaveBeenCalled();
  });
});

describe("PUT /api/perfil/meus-dados", () => {
  it("atualiza só os campos editáveis do produtor logado", async () => {
    const response = await put({ email: ME, nomeFantasia: "Novo Nome", telefone: "(14) 99999-9999", status: "APROVADO", documento: "000" });

    expect(response.status).toBe(200);
    expect(prismaMock.vendedor.update).toHaveBeenCalledWith({
      where: { email: ME },
      data: { nomeFantasia: "Novo Nome", telefone: "(14) 99999-9999" },
    });
  });

  it("recusa dados inválidos sem gravar nada", async () => {
    expect((await put({ cep: "123" })).status).toBe(400);
    expect((await put({ nomeFantasia: "ab" })).status).toBe(400);
    expect((await put({ estado: "ZZ" })).status).toBe(400);
    expect(prismaMock.vendedor.update).not.toHaveBeenCalled();
  });

  it("recusa corpo quebrado e administrador", async () => {
    const quebrado = await PUT(new Request(url, { method: "PUT", headers: authHeaders(ME), body: "{nada" }));
    expect(quebrado.status).toBe(400);
    expect((await put({ nomeFantasia: "Admin Teste" }, authHeaders(ME, "admin"))).status).toBe(403);
  });

  describe("troca de senha", () => {
    const SENHA_ATUAL = "Atual@2026!";
    let hashAtual: string;

    beforeEach(async () => {
      hashAtual ??= await bcrypt.hash(SENHA_ATUAL, 4);
      prismaMock.acesso.findFirst.mockResolvedValue({ tipoUser: "produtor", cdVendedor: 1, hash: hashAtual });
    });

    it("guarda a senha nova com hash junto com os dados (o login compara com bcrypt)", async () => {
      const response = await put({ email: ME, nomeFantasia: "Sítio Bom", novaSenha: "Raiz@2026!", senhaAtual: SENHA_ATUAL });

      expect(response.status).toBe(200);
      const { hash } = prismaMock.acesso.updateMany.mock.calls[0][0].data;
      expect(hash).not.toBe("Raiz@2026!");
      expect(await bcrypt.compare("Raiz@2026!", hash)).toBe(true);
      expect(prismaMock.vendedor.update.mock.calls[0][0].data).toEqual({ nomeFantasia: "Sítio Bom" });
      expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    });

    it("exige a senha atual: sem ela ou errada não grava nada", async () => {
      const sem = await put({ novaSenha: "Raiz@2026!" });
      expect(sem.status).toBe(400);

      const errada = await put({ novaSenha: "Raiz@2026!", senhaAtual: "Outra@2026!" });
      expect(errada.status).toBe(403);
      expect((await errada.json()).error).toMatch(/senha atual/i);

      expect(prismaMock.acesso.updateMany).not.toHaveBeenCalled();
      expect(prismaMock.vendedor.update).not.toHaveBeenCalled();
    });

    it("recusa senha fraca e senha igual à atual", async () => {
      expect((await put({ novaSenha: "123456", senhaAtual: SENHA_ATUAL })).status).toBe(400);
      const igual = await put({ novaSenha: SENHA_ATUAL, senhaAtual: SENHA_ATUAL });
      expect(igual.status).toBe(400);
      expect((await igual.json()).error).toMatch(/diferente/);
      expect(prismaMock.acesso.updateMany).not.toHaveBeenCalled();
    });

    it("trava depois de 5 senhas atuais erradas seguidas", async () => {
      const headers = { ...authHeaders("trava@teste.com"), "x-forwarded-for": "9.9.9.9" };
      const tentar = (senhaAtual: string) => put({ novaSenha: "Raiz@2026!", senhaAtual }, headers);

      for (let i = 0; i < 5; i++) expect((await tentar("errada")).status).toBe(403);
      const travada = await tentar(SENHA_ATUAL);

      expect(travada.status).toBe(429);
      expect(travada.headers.get("Retry-After")).toBeTruthy();
    });
  });

  it("não deixa alterar a conta de outra pessoa", async () => {
    const response = await put({ email: "outra@teste.com", nomeFantasia: "Invasor" });

    expect(response.status).toBe(403);
    expect(prismaMock.vendedor.update).not.toHaveBeenCalled();
  });

  it("o perfil vem do token: mercado grava em cliente", async () => {
    await put({ tipoUser: "produtor", nomeFantasia: "Mercado Bom" }, authHeaders(ME, "mercado"));

    expect(prismaMock.cliente.update).toHaveBeenCalledTimes(1);
    expect(prismaMock.vendedor.update).not.toHaveBeenCalled();
  });

  it("recusa sem token", async () => {
    expect((await put({ nomeFantasia: "X" }, {})).status).toBe(401);
  });
});

describe("DELETE /api/perfil/meus-dados", () => {
  it("exclui a própria conta (login e perfil juntos) e apaga o cookie", async () => {
    const response = await DELETE(new Request(`${url}?email=${ME}`, { method: "DELETE", headers: authHeaders(ME) }));

    expect(response.status).toBe(200);
    expect(prismaMock.vendedor.delete).toHaveBeenCalledWith({ where: { email: ME } });
    expect(prismaMock.acesso.deleteMany).toHaveBeenCalledWith({ where: { login: ME } });
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    expect(response.headers.get("set-cookie")).toMatch(/token=;/);
  });

  it("com pedidos ligados responde 409 em vez de erro do servidor", async () => {
    prismaMock.$transaction.mockRejectedValue(Object.assign(new Error("fk"), { code: "P2003" }));
    const response = await DELETE(new Request(`${url}?email=${ME}`, { method: "DELETE", headers: authHeaders(ME) }));

    expect(response.status).toBe(409);
    expect((await response.json()).error).toMatch(/pedidos ou ofertas/);
  });

  it("recusa sem token e a conta de outra pessoa", async () => {
    expect((await DELETE(new Request(`${url}?email=${ME}`, { method: "DELETE" }))).status).toBe(401);
    const other = await DELETE(new Request(`${url}?email=outra@teste.com`, { method: "DELETE", headers: authHeaders(ME) }));
    expect(other.status).toBe(403);
    expect(prismaMock.vendedor.delete).not.toHaveBeenCalled();
  });
});
