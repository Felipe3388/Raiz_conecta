import { describe, expect, it } from "vitest";
import {
  EMAIL_MESSAGE,
  isValidEmail,
  isValidPassword,
  maskPhone,
  PASSWORD_MESSAGE,
  PASSWORDS_DIFFER_MESSAGE,
  passwordRequirements,
  passwordStrength,
  validateLogin,
  validateSignup,
} from "./auth";

describe("isValidEmail", () => {
  it.each(["maria@teste.com", " maria@teste.com ", "a.b+c@sitio.com.br"])("aceita %p", (email) => {
    expect(isValidEmail(email)).toBe(true);
  });
  it.each(["", "maria", "maria@", "maria@teste", "maria@teste.c", "ma ria@teste.com"])("recusa %p", (email) => {
    expect(isValidEmail(email)).toBe(false);
  });
});

describe("senha", () => {
  it("lista o que falta, um requisito por linha", () => {
    const missing = passwordRequirements("abc").filter((item) => !item.met).map((item) => item.label);
    expect(missing).toEqual(["Pelo menos 8 caracteres", "Uma letra maiúscula (A-Z)", "Um número (0-9)", "Um símbolo (! @ # $ %)"]);
  });

  it("aceita senha com os 5 requisitos", () => {
    expect(isValidPassword("Raiz@2026!")).toBe(true);
    expect(isValidPassword("raiz@2026!")).toBe(false);
    expect(isValidPassword("Raiz2026aa")).toBe(false);
  });

  it("mede a força de 0 a 5 barras", () => {
    expect(passwordStrength("abc").label).toBe("Muito fraca");
    expect(passwordStrength("Raiz@2026!").score).toBe(4);
    expect(passwordStrength("Raiz@2026!Forte").label).toBe("Muito forte");
  });
});

describe("maskPhone", () => {
  it.each([
    ["1", "1"],
    ["14", "14"],
    ["149", "(14) 9"],
    ["1499", "(14) 99"],
    ["149999", "(14) 9999"],
    ["14999999", "(14) 9999-99"],
    ["1499999999", "(14) 9999-9999"],
    ["14999999999", "(14) 99999-9999"],
    ["(14) 99999-9999 99", "(14) 99999-9999"],
    ["abc", ""],
  ])("%p vira %p", (input, output) => {
    expect(maskPhone(input)).toBe(output);
  });
});

describe("validateLogin", () => {
  it("pede e-mail e senha", () => {
    expect(validateLogin({ email: "", senha: "x" })).toBe("Preencha o e-mail e a senha.");
    expect(validateLogin({ email: "a@b.com", senha: "" })).toBe("Preencha o e-mail e a senha.");
  });
  it("recusa e-mail mal escrito e aceita o certo", () => {
    expect(validateLogin({ email: "maria", senha: "x" })).toBe(EMAIL_MESSAGE);
    expect(validateLogin({ email: "maria@teste.com", senha: "x" })).toBeNull();
  });
});

describe("validateSignup", () => {
  const ok = { nome: "Sítio Boa Terra", email: "maria@teste.com", telefone: "(14) 99999-9999", senha: "Raiz@2026!", confirmarSenha: "Raiz@2026!" };

  it("aceita dados corretos, com ou sem telefone", () => {
    expect(validateSignup(ok)).toBeNull();
    expect(validateSignup({ ...ok, telefone: "" })).toBeNull();
  });
  it("aponta o primeiro problema", () => {
    expect(validateSignup({ ...ok, nome: "Ab" })).toMatch(/nome fantasia/);
    expect(validateSignup({ ...ok, email: "x" })).toBe(EMAIL_MESSAGE);
    expect(validateSignup({ ...ok, telefone: "123" })).toMatch(/Telefone/);
    expect(validateSignup({ ...ok, senha: "fraca", confirmarSenha: "fraca" })).toBe(PASSWORD_MESSAGE);
    expect(validateSignup({ ...ok, confirmarSenha: "Outra@2026!" })).toBe(PASSWORDS_DIFFER_MESSAGE);
  });
});
