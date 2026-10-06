import type { RegistrationData } from "@/types/registration";
import { buildRegistrationFields } from "./registrationFields";

const data: RegistrationData = {
  account: {
    profile: "produtor",
    nome: "Fazenda São João",
    email: "ana@sitio.com",
    telefone: "(11) 99999-9999",
    senha: "Senha@123",
    confirmarSenha: "Senha@123",
    acceptedTerms: true,
  },
  profile: {
    documentType: "CPF",
    documento: "123.456.789-01",
    proofType: "CNH",
    cep: "18110-000",
    rua: "Estrada Rural",
    numero: "12",
    bairro: "Centro",
    cidade: "Votorantim",
    estado: "SP",
    attachment: { uri: "file:///doc.jpg", name: "doc.jpg", mimeType: "image/jpeg" },
  },
};

describe("buildRegistrationFields", () => {
  it("monta os campos no formato esperado por POST /api/auth/cadastro", () => {
    expect(buildRegistrationFields(data)).toEqual({
      tipoUsuario: "produtor",
      nome: "Fazenda São João",
      email: "ana@sitio.com",
      senha: "Senha@123",
      telefone: "(11) 99999-9999",
      tipoDoc: "CPF",
      documento: "12345678901",
      tipoComprovante: "CNH",
      cep: "18110000",
      rua: "Estrada Rural",
      numero: "12",
      bairro: "Centro",
      cidade: "Votorantim",
      estado: "SP",
    });
  });

  it("remove espaços das pontas e coloca a UF em maiúsculas", () => {
    const fields = buildRegistrationFields({
      ...data,
      account: { ...data.account, nome: "  Fazenda  ", email: " ana@sitio.com " },
      profile: { ...data.profile, estado: "sp", rua: " Estrada Rural " },
    });

    expect(fields).toMatchObject({
      nome: "Fazenda",
      email: "ana@sitio.com",
      estado: "SP",
      rua: "Estrada Rural",
    });
  });
});
