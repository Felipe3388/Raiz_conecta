import { validateLogin } from "./loginValidation";

describe("validateLogin", () => {
  it("aceita e-mail e senha preenchidos", () => {
    expect(validateLogin({ email: "ana@sitio.com", senha: "123456" })).toBeNull();
  });

  it("exige o e-mail", () => {
    expect(validateLogin({ email: "  ", senha: "123456" })).toBe("Informe seu e-mail.");
  });

  it("rejeita e-mail em formato inválido", () => {
    expect(validateLogin({ email: "ana@", senha: "123456" })).toBe("Informe um e-mail válido.");
  });

  it("exige a senha", () => {
    expect(validateLogin({ email: "ana@sitio.com", senha: "" })).toBe("Informe sua senha.");
  });
});
