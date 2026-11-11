import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  acesso: { findFirst: vi.fn() },
  vendedor: { create: vi.fn() },
  cliente: { create: vi.fn() },
}));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/media/upload", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/media/upload")>()),
  uploadFile: vi.fn().mockResolvedValue("https://res.cloudinary.com/x/raw/docs/abc.jpg"),
}));
const notifyMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/notify/email", () => ({ notify: notifyMock }));

import { POST } from "./route";

const fields: Record<string, string> = {
  tipoUsuario: "produtor",
  nome: "Sítio Boa Vista",
  email: "Maria@Teste.com",
  senha: "Senha@123",
  telefone: "(15) 99999-1234",
  tipoDoc: "CPF",
  documento: "12345678901",
  cep: "18110000",
  rua: "Rua A",
  numero: "10",
  bairro: "Centro",
  cidade: "Votorantim",
  estado: "sp",
};

function request(change: Record<string, string | null> = {}, file: File | null = new File(["x"], "rg.jpg", { type: "image/jpeg" })) {
  const form = new FormData();
  for (const [key, value] of Object.entries({ ...fields, ...change })) if (value !== null) form.append(key, value);
  if (file) form.append("file", file);
  return POST(new Request("http://x/api/auth/cadastro", { method: "POST", body: form }));
}

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.acesso.findFirst.mockResolvedValue(null);
});

describe("POST /api/auth/cadastro", () => {
  it("cria o produtor e o acesso já em análise, com e-mail em minúsculas e só números no documento", async () => {
    const response = await request({ documento: "123.456.789-01", cep: "18110-000" });

    expect(response.status).toBe(201);
    const { data } = prismaMock.vendedor.create.mock.calls[0][0];
    expect(data).toMatchObject({
      nomeFantasia: "Sítio Boa Vista",
      email: "maria@teste.com",
      status: "EM_ANALISE",
      documento: "12345678901",
      cep: "18110000",
      estado: "SP",
      urlDocumento: "https://res.cloudinary.com/x/raw/docs/abc.jpg",
    });
    expect(data.Acessos.create).toMatchObject({ login: "maria@teste.com", tipoUser: "produtor", status: "EM_ANALISE" });
    expect(data.Acessos.create.hash).not.toBe("Senha@123");
    expect(notifyMock).toHaveBeenCalledWith("boas-vindas", expect.objectContaining({ email: "maria@teste.com" }));
  });

  it("cadastra mercado na tabela de clientes", async () => {
    expect((await request({ tipoUsuario: "mercado", tipoDoc: "CNPJ", documento: "12345678000190" })).status).toBe(201);
    expect(prismaMock.cliente.create).toHaveBeenCalledTimes(1);
    expect(prismaMock.vendedor.create).not.toHaveBeenCalled();
  });

  it("recusa dados inválidos com a mensagem do que falta", async () => {
    expect((await (await request({ senha: "fraca" })).json()).error).toMatch(/senha/i);
    expect((await (await request({ tipoUsuario: "admin" })).json()).error).toMatch(/Tipo de perfil/);
    expect((await (await request({ documento: "1" })).json()).error).toMatch(/CPF/);
    expect(prismaMock.vendedor.create).not.toHaveBeenCalled();
  });

  it("exige o documento anexado, de um tipo permitido", async () => {
    expect((await request({}, null)).status).toBe(400);
    expect((await request({}, new File(["x"], "a.exe", { type: "application/x-msdownload" }))).status).toBe(400);
  });

  it("recusa e-mail que já tem conta, sem diferenciar maiúsculas (409)", async () => {
    prismaMock.acesso.findFirst.mockResolvedValue({ id: 1 });
    const response = await request();

    expect(response.status).toBe(409);
    expect(prismaMock.acesso.findFirst).toHaveBeenCalledWith({ where: { login: { equals: "maria@teste.com", mode: "insensitive" } } });
  });

  it("trata o e-mail repetido que o banco barrou (corrida entre dois cadastros)", async () => {
    prismaMock.vendedor.create.mockRejectedValue(Object.assign(new Error("unique"), { code: "P2002" }));
    expect((await request()).status).toBe(409);
  });
});
