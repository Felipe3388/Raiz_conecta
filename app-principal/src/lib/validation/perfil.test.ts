import { describe, expect, it } from "vitest";
import { parsePerfilChanges } from "./perfil";

const ok = (body: Record<string, unknown>) => {
  const result = parsePerfilChanges(body);
  if (!result.ok) throw new Error(result.error);
  return result.data;
};
const error = (body: Record<string, unknown>) => {
  const result = parsePerfilChanges(body);
  return result.ok ? null : result.error;
};

describe("parsePerfilChanges", () => {
  it("só devolve os campos que vieram, arrumados", () => {
    expect(ok({ nomeFantasia: "  Sítio Bom  ", cep: "17.500-000", estado: "sp", status: "APROVADO", documento: "1", email: "x@y.com" })).toEqual({
      nomeFantasia: "Sítio Bom",
      cep: "17500000",
      estado: "SP",
    });
    expect(ok({})).toEqual({});
    expect(ok({ nomeFantasia: 123, cep: null })).toEqual({});
  });

  it("telefone vazio apaga; preenchido precisa de DDD + número", () => {
    expect(ok({ telefone: "" })).toEqual({ telefone: null });
    expect(ok({ telefone: "(14) 99999-9999" })).toEqual({ telefone: "(14) 99999-9999" });
    expect(error({ telefone: "9999" })).toMatch(/Telefone inválido/);
    expect(error({ telefone: "1".repeat(30) })).toMatch(/Telefone inválido/);
  });

  it("não deixa apagar o que é obrigatório", () => {
    expect(error({ nomeFantasia: "  " })).toMatch(/mínimo 3 letras/);
    expect(error({ rua: "" })).toMatch(/rua, número e cidade/);
    expect(error({ numero: " " })).toMatch(/rua, número e cidade/);
    expect(error({ cidade: "" })).toMatch(/rua, número e cidade/);
    expect(error({ cep: "123" })).toMatch(/CEP inválido/);
    expect(error({ estado: "XX" })).toMatch(/Estado inválido/);
  });

  it("bairro pode ficar vazio, mas não ser enorme", () => {
    expect(ok({ bairro: "" })).toEqual({ bairro: "" });
    expect(error({ bairro: "a".repeat(81) })).toMatch(/bairro/);
    expect(error({ nomeFantasia: "a".repeat(121) })).toMatch(/até 120/);
    expect(error({ rua: "a".repeat(121) })).toMatch(/rua/);
  });
});
