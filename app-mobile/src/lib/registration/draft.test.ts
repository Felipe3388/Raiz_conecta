import { emptyAccount, emptyProfile } from "./draft";

describe("rascunho do cadastro", () => {
  it("começa sem dados e sem termos aceitos", () => {
    expect(emptyAccount()).toEqual({
      nome: "",
      email: "",
      telefone: "",
      senha: "",
      confirmarSenha: "",
      acceptedTerms: false,
    });
  });

  it("começa com CPF e RG, sem anexo", () => {
    expect(emptyProfile()).toMatchObject({
      documentType: "CPF",
      proofType: "RG",
      documento: "",
      attachment: null,
    });
  });

  it("devolve objetos novos a cada chamada", () => {
    expect(emptyAccount()).not.toBe(emptyAccount());
    expect(emptyProfile()).not.toBe(emptyProfile());
  });
});
