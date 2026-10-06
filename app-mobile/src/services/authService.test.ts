import { ApiError } from "@/lib/http/ApiError";
import type { TokenStorage } from "@/lib/storage";
import { makeToken } from "@/test-utils/makeToken";
import { AuthError } from "./AuthError";
import { AuthService } from "./authService";

const NOW_MS = 1_800_000_000_000;
const NOW_S = NOW_MS / 1000;

const produtorPayload = {
  email: "ana@sitio.com",
  role: "produtor",
  nome: "Sítio da Ana",
  status: "APROVADO",
};

function loginResponse(overrides: { tipoUser?: string; status?: string } = {}) {
  const { tipoUser = "produtor", status = "APROVADO" } = overrides;
  return {
    message: "Login realizado com sucesso!",
    token: makeToken({ ...produtorPayload, role: tipoUser, status, exp: NOW_S + 7200 }),
    user: { email: "ana@sitio.com", tipoUser, nome: "Sítio da Ana", status },
  };
}

class FakeTokenStorage implements TokenStorage {
  constructor(public token: string | null = null) {}
  get = jest.fn(async () => this.token);
  save = jest.fn(async (token: string) => {
    this.token = token;
  });
  clear = jest.fn(async () => {
    this.token = null;
  });
}

function setup(storedToken: string | null = null) {
  const api = { post: jest.fn() };
  const storage = new FakeTokenStorage(storedToken);
  const service = new AuthService(api, storage, () => NOW_MS);
  return { api, storage, service };
}

describe("AuthService.login", () => {
  it("envia as credenciais, salva o token e devolve o usuário", async () => {
    const { api, storage, service } = setup();
    const response = loginResponse();
    api.post.mockResolvedValue(response);

    const user = await service.login("ana@sitio.com", "Senha@123");

    expect(api.post).toHaveBeenCalledWith("/api/auth/login", {
      email: "ana@sitio.com",
      senha: "Senha@123",
    });
    expect(storage.save).toHaveBeenCalledWith(response.token);
    expect(user).toEqual(response.user);
  });

  it("não salva o token quando a conta está em análise", async () => {
    const { api, storage, service } = setup();
    api.post.mockResolvedValue(loginResponse({ status: "EM_ANALISE" }));

    await expect(service.login("ana@sitio.com", "x")).rejects.toMatchObject({
      name: "AuthError",
      code: "EM_ANALISE",
    });
    expect(storage.save).not.toHaveBeenCalled();
  });

  it("não salva o token para perfil que não é produtor", async () => {
    const { api, storage, service } = setup();
    api.post.mockResolvedValue(loginResponse({ tipoUser: "mercado" }));

    const promise = service.login("loja@mercado.com", "x");

    await expect(promise).rejects.toBeInstanceOf(AuthError);
    await expect(promise).rejects.toMatchObject({ code: "PERFIL_NAO_PERMITIDO" });
    expect(storage.save).not.toHaveBeenCalled();
  });

  it("propaga o ApiError da API (ex.: credenciais inválidas)", async () => {
    const { api, storage, service } = setup();
    api.post.mockRejectedValue(new ApiError("E-mail ou senha incorretos.", 401));

    await expect(service.login("a@b.com", "errada")).rejects.toMatchObject({
      message: "E-mail ou senha incorretos.",
      status: 401,
    });
    expect(storage.save).not.toHaveBeenCalled();
  });
});

describe("AuthService.restoreSession", () => {
  it("devolve o usuário quando o token guardado ainda é válido", async () => {
    const token = makeToken({ ...produtorPayload, exp: NOW_S + 60 });
    const { service } = setup(token);

    await expect(service.restoreSession()).resolves.toEqual({
      email: "ana@sitio.com",
      nome: "Sítio da Ana",
      tipoUser: "produtor",
      status: "APROVADO",
    });
  });

  it("devolve null quando não há token", async () => {
    const { service } = setup(null);

    await expect(service.restoreSession()).resolves.toBeNull();
  });

  it("limpa e devolve null quando o token expirou", async () => {
    const token = makeToken({ ...produtorPayload, exp: NOW_S - 1 });
    const { service, storage } = setup(token);

    await expect(service.restoreSession()).resolves.toBeNull();
    expect(storage.clear).toHaveBeenCalled();
  });

  it("devolve null quando o armazenamento falha ao ler", async () => {
    const { service, storage } = setup();
    storage.get.mockRejectedValue(new Error("armazenamento indisponível"));

    await expect(service.restoreSession()).resolves.toBeNull();
  });

  it("limpa e devolve null quando o token é ilegível", async () => {
    const { service, storage } = setup("lixo");

    await expect(service.restoreSession()).resolves.toBeNull();
    expect(storage.clear).toHaveBeenCalled();
  });

  it("limpa e devolve null quando a conta deixou de ter acesso", async () => {
    const token = makeToken({ ...produtorPayload, status: "SUSPENSO", exp: NOW_S + 60 });
    const { service, storage } = setup(token);

    await expect(service.restoreSession()).resolves.toBeNull();
    expect(storage.clear).toHaveBeenCalled();
  });
});

describe("AuthService.logout", () => {
  it("remove o token guardado", async () => {
    const { service, storage } = setup("qualquer");

    await service.logout();

    expect(storage.clear).toHaveBeenCalled();
  });
});
