import { makeToken } from "@/test-utils/makeToken";
import { decodeToken } from "./jwt";

describe("decodeToken", () => {
  it("extrai o payload de um JWT", () => {
    const token = makeToken({
      email: "ana@sitio.com",
      role: "produtor",
      nome: "Sítio da Ana",
      status: "APROVADO",
      exp: 1_900_000_000,
    });

    expect(decodeToken(token)).toEqual({
      email: "ana@sitio.com",
      role: "produtor",
      nome: "Sítio da Ana",
      status: "APROVADO",
      exp: 1_900_000_000,
    });
  });

  it("preserva acentos e caracteres base64url", () => {
    const token = makeToken({
      email: "a@b.com",
      role: "produtor",
      nome: "Açaí & Cia ~ÿ??>>",
      status: "APROVADO",
      exp: 1,
    });

    expect(decodeToken(token)?.nome).toBe("Açaí & Cia ~ÿ??>>");
  });

  it.each(["", "abc", "a.b", "a.%%%.c"])("retorna null para token inválido (%p)", (token) => {
    expect(decodeToken(token)).toBeNull();
  });

  it("retorna null quando faltam campos obrigatórios", () => {
    expect(decodeToken(makeToken({ email: "a@b.com" }))).toBeNull();
  });
});
