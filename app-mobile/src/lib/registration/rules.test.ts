import { DOCUMENT_TYPES, allowedProofTypes } from "./rules";

describe("DOCUMENT_TYPES", () => {
  it("o produtor pode se cadastrar com CPF ou CNPJ", () => {
    expect(DOCUMENT_TYPES).toEqual(["CPF", "CNPJ"]);
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
