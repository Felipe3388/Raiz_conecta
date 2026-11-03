import { describe, expect, it } from "vitest";
import { emailForStatus, isManagedType, isUserStatus, pickUserEdit } from "./usuarios";

describe("admin/usuarios", () => {
  it("só produtor e mercado são geridos aqui", () => {
    expect(isManagedType("produtor")).toBe(true);
    expect(isManagedType("mercado")).toBe(true);
    expect(isManagedType("admin")).toBe(false);
    expect(isManagedType(undefined)).toBe(false);
  });

  it("só aceita os quatro status", () => {
    expect(isUserStatus("SUSPENSO")).toBe(true);
    expect(isUserStatus("BANIDO")).toBe(false);
  });

  it("escolhe o e-mail de cada status", () => {
    expect(emailForStatus("APROVADO")).toBe("aprovacao");
    expect(emailForStatus("REJEITADO")).toBe("rejeicao");
    expect(emailForStatus("SUSPENSO")).toBe("suspensao");
    expect(emailForStatus("EM_ANALISE")).toBeNull();
  });

  it("pickUserEdit leva só os campos editáveis, limpos", () => {
    expect(pickUserEdit({ nomeFantasia: "  Sítio Novo ", telefone: "(15) 9", cidade: "Sorocaba", estado: "sp", status: "APROVADO", email: "x@y.com" })).toEqual({
      nomeFantasia: "Sítio Novo",
      telefone: "(15) 9",
      cidade: "Sorocaba",
      estado: "SP",
    });
  });

  it("pickUserEdit ignora nome curto demais e valores que não são texto", () => {
    expect(pickUserEdit({ nomeFantasia: "Jo", telefone: 5, cidade: null })).toEqual({});
  });
});
