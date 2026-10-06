import { allowedDocumentTypes, allowedProofTypes, profileDefaults } from "./rules";

describe("allowedDocumentTypes", () => {
  it("produtor pode usar CPF ou CNPJ", () => {
    expect(allowedDocumentTypes("produtor")).toEqual(["CPF", "CNPJ"]);
  });

  it("mercado só pode usar CNPJ", () => {
    expect(allowedDocumentTypes("mercado")).toEqual(["CNPJ"]);
  });
});

describe("allowedProofTypes", () => {
  it("CPF aceita RG ou CNH", () => {
    expect(allowedProofTypes("CPF")).toEqual(["RG", "CNH"]);
  });

  it("CNPJ aceita Contrato Social ou Cartão CNPJ", () => {
    expect(allowedProofTypes("CNPJ")).toEqual(["CONTRATO_SOCIAL", "CARTAO_CNPJ"]);
  });
});

describe("profileDefaults", () => {
  it("produtor começa com CPF e RG", () => {
    expect(profileDefaults("produtor")).toEqual({
      documentType: "CPF",
      proofType: "RG",
      documento: "",
    });
  });

  it("mercado começa com CNPJ e Contrato Social", () => {
    expect(profileDefaults("mercado")).toEqual({
      documentType: "CNPJ",
      proofType: "CONTRATO_SOCIAL",
      documento: "",
    });
  });
});
