import type { AccountFields, ProfileFields } from "@/types/registration";
import { validateAccount, validateProfile } from "./registration";

const account: AccountFields = {
  profile: "produtor",
  nome: "Fazenda São João",
  email: "ana@sitio.com",
  telefone: "(11) 99999-9999",
  senha: "Senha@123",
  confirmarSenha: "Senha@123",
  acceptedTerms: true,
};

const profile: ProfileFields = {
  documentType: "CPF",
  documento: "123.456.789-01",
  proofType: "RG",
  cep: "18110-000",
  rua: "Estrada Rural",
  numero: "S/N",
  bairro: "Centro",
  cidade: "Votorantim",
  estado: "SP",
  attachment: { uri: "file:///doc.jpg", name: "doc.jpg", mimeType: "image/jpeg" },
};

describe("validateAccount", () => {
  it("aceita os dados completos", () => {
    expect(validateAccount(account)).toBeNull();
  });

  it.each([
    [{ nome: "  " }, "Informe o nome fantasia ou razão social."],
    [{ email: "ana@" }, "E-mail inválido. Use o formato nome@dominio.com."],
    [{ telefone: "(11) 9999" }, "Informe um telefone válido com DDD."],
    [
      { senha: "fraca", confirmarSenha: "fraca" },
      "A senha deve ter mínimo 8 caracteres, letra maiúscula, minúscula, número e caractere especial (!@#$%...).",
    ],
    [{ confirmarSenha: "Outra@123" }, "As senhas não coincidem. Verifique e tente novamente."],
    [{ acceptedTerms: false }, "Aceite os Termos de Uso e a Política de Privacidade."],
  ])("recusa %p", (override, message) => {
    expect(validateAccount({ ...account, ...override })).toBe(message);
  });

  it("aceita telefone fixo com 10 dígitos", () => {
    expect(validateAccount({ ...account, telefone: "(11) 3333-4444" })).toBeNull();
  });
});

describe("validateProfile", () => {
  it("aceita os dados completos", () => {
    expect(validateProfile(profile, "produtor")).toBeNull();
  });

  it("aceita CNPJ com 14 dígitos", () => {
    expect(
      validateProfile(
        {
          ...profile,
          documentType: "CNPJ",
          documento: "12.345.678/0001-99",
          proofType: "CARTAO_CNPJ",
        },
        "produtor",
      ),
    ).toBeNull();
  });

  it.each([
    [{ documento: "123.456" }, "CPF deve ter 11 dígitos."],
    [
      { documentType: "CNPJ" as const, documento: "123.456.789-01", proofType: "CARTAO_CNPJ" as const },
      "CNPJ deve ter 14 dígitos.",
    ],
    [{ cep: "18110" }, "Informe um CEP válido."],
    [{ rua: " " }, "Informe a rua ou estrada."],
    [{ numero: "" }, "Informe o número (ou S/N)."],
    [{ bairro: "" }, "Informe o bairro."],
    [{ cidade: "" }, "Informe a cidade."],
    [{ estado: "S" }, "Informe a UF com 2 letras."],
    [{ attachment: null }, "Anexe a foto do seu documento para validação."],
  ])("recusa %p", (override, message) => {
    expect(validateProfile({ ...profile, ...override }, "produtor")).toBe(message);
  });

  it("mercado só pode se cadastrar com CNPJ", () => {
    expect(validateProfile(profile, "mercado")).toBe(
      "Mercado / Supermercado só pode se cadastrar com CNPJ.",
    );
  });

  it("mercado com CNPJ e comprovante compatível é aceito", () => {
    const market = {
      ...profile,
      documentType: "CNPJ" as const,
      documento: "12.345.678/0001-99",
      proofType: "CONTRATO_SOCIAL" as const,
    };

    expect(validateProfile(market, "mercado")).toBeNull();
  });

  it("recusa comprovante que não combina com o documento", () => {
    expect(validateProfile({ ...profile, proofType: "CARTAO_CNPJ" }, "produtor")).toBe(
      "Escolha uma foto que combine com o documento informado.",
    );
  });
});
