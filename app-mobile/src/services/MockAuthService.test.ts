import { ApiError } from "@/lib/http/ApiError";
import { AuthError } from "./AuthError";
import { MockAuthService } from "./MockAuthService";

function createService() {
  return new MockAuthService({ latencyMs: 0 });
}

describe("MockAuthService", () => {
  it("entra como produtor aprovado com qualquer e-mail e senha", async () => {
    const user = await createService().login("ana@sitio.com", "qualquer");

    expect(user).toMatchObject({
      email: "ana@sitio.com",
      tipoUser: "produtor",
      status: "APROVADO",
    });
  });

  it("usa o início do e-mail como nome do produtor", async () => {
    const user = await createService().login("sitio.da.ana@x.com", "123");

    expect(user.nome).toBe("sitio.da.ana");
  });

  it.each([
    ["analise@teste.com", "EM_ANALISE"],
    ["rejeitado@teste.com", "BLOQUEADO"],
    ["suspenso@teste.com", "BLOQUEADO"],
    ["mercado@teste.com", "PERFIL_NAO_PERMITIDO"],
  ])("e-mail %s reproduz o bloqueio %s", async (email, code) => {
    const promise = createService().login(email, "123");

    await expect(promise).rejects.toBeInstanceOf(AuthError);
    await expect(promise).rejects.toMatchObject({ code });
  });

  it("senha 'errada' reproduz credenciais inválidas", async () => {
    await expect(createService().login("ana@sitio.com", "errada")).rejects.toMatchObject({
      message: "E-mail ou senha incorretos.",
      status: 401,
    });
    await expect(createService().login("ana@sitio.com", "errada")).rejects.toBeInstanceOf(ApiError);
  });

  it("começa sem sessão, para sempre mostrar o login primeiro", async () => {
    await expect(createService().restoreSession()).resolves.toBeNull();
  });

  it("logout não falha", async () => {
    await expect(createService().logout()).resolves.toBeUndefined();
  });
});
