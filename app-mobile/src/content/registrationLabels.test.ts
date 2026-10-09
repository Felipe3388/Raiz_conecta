import { DOCUMENT_LABELS, PROOF_LABELS, PROOF_PHOTO_TITLES } from "./registrationLabels";

describe("textos do passo 2 do cadastro", () => {
  it("todo documento e comprovante tem texto", () => {
    expect(Object.keys(DOCUMENT_LABELS).sort()).toEqual(["CNPJ", "CPF"]);
    expect(Object.keys(PROOF_LABELS).sort()).toEqual(["CARTAO_CNPJ", "CNH", "CONTRATO_SOCIAL", "RG"]);
    expect(Object.keys(PROOF_PHOTO_TITLES).sort()).toEqual(Object.keys(PROOF_LABELS).sort());
  });

  it("o título da foto é uma frase inteira (sem palavras coladas)", () => {
    for (const title of Object.values(PROOF_PHOTO_TITLES)) {
      expect(title).toMatch(/^Foto d[oa] [A-ZÀ-Ú]/);
    }
  });
});
