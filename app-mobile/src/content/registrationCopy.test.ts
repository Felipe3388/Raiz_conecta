import { NAME_FIELD_COPY } from "./registrationCopy";

describe("NAME_FIELD_COPY", () => {
  it("tem rótulo, dica e exemplo para cada perfil", () => {
    for (const profile of ["produtor", "mercado"] as const) {
      const copy = NAME_FIELD_COPY[profile];
      expect(copy.label.trim()).not.toBe("");
      expect(copy.hint.trim()).not.toBe("");
      expect(copy.placeholder.startsWith("Ex.: ")).toBe(true);
    }
  });

  it("fala de fazenda ou sítio para o produtor", () => {
    expect(NAME_FIELD_COPY.produtor.label).toMatch(/fazenda|sítio/i);
  });

  it("não fala de fazenda ou sítio para o mercado", () => {
    const { label, hint, placeholder } = NAME_FIELD_COPY.mercado;
    expect(`${label} ${hint} ${placeholder}`).not.toMatch(/fazenda|sítio/i);
    expect(label).toMatch(/mercado/i);
  });
});
