import { describe, expect, it } from "vitest";
import { validateCadastro, validateDocumento, type CadastroFields } from "./cadastro";

const valid: CadastroFields = {
  tipoUsuario: "produtor",
  nome: "Sítio Boa Vista",
  email: "maria@teste.com",
  senha: "Senha@123",
  telefone: "(15) 99999-1234",
  tipoDoc: "CPF",
  documento: "12345678901",
  cep: "18110-000",
  rua: "Rua A",
  numero: "10",
  bairro: "Centro",
  cidade: "Votorantim",
  estado: "sp",
};

describe("validateCadastro", () => {
  it("aceita um cadastro completo", () => {
    expect(validateCadastro(valid)).toBeNull();
    expect(validateCadastro({ ...valid, tipoUsuario: "mercado", tipoDoc: "CNPJ", documento: "12.345.678/0001-90", bairro: "", telefone: "" })).toBeNull();
  });

  it.each([
    [{ tipoUsuario: "admin" }, "Tipo de perfil inválido. Selecione Produtor Rural ou Mercado."],
    [{ nome: "Jo" }, "Informe o nome fantasia ou razão social (mínimo 3 letras)."],
    [{ email: "maria" }, "E-mail inválido. Use o formato nome@dominio.com."],
    [{ senha: "fraca" }, "A senha deve ter mínimo 8 caracteres, letra maiúscula, minúscula, número e caractere especial (!@#$%...)."],
    [{ telefone: "123" }, "Telefone inválido. Use DDD + número."],
    [{ documento: "123" }, "CPF inválido. Use os 11 números."],
    [{ cep: "123" }, "CEP inválido. Use os 8 números."],
    [{ rua: " " }, "Preencha rua, número e cidade."],
    [{ estado: "XX" }, "Estado inválido. Use a sigla, como SP."],
  ])("recusa %j", (change, message) => {
    expect(validateCadastro({ ...valid, ...change })).toBe(message);
  });
});

describe("validateDocumento", () => {
  it("confere o tamanho por tipo, ignorando pontos e traços", () => {
    expect(validateDocumento("CPF", "123.456.789-01")).toBeNull();
    expect(validateDocumento("CNPJ", "12.345.678/0001-90")).toBeNull();
    expect(validateDocumento("CNPJ", "123")).toBe("CNPJ inválido. Use os 14 números.");
    expect(validateDocumento("RG", "123")).toBe("Escolha CPF ou CNPJ.");
  });
});
