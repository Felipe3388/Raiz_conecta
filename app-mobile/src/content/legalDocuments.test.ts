import { PRIVACY_POLICY, TERMS_OF_USE } from "./legalDocuments";

describe.each([
  ["Termos de Uso", "Raiz Conecta — Plataforma de Agronegócio", TERMS_OF_USE, 10],
  ["Política de Privacidade", "Raiz Conecta — Como tratamos seus dados", PRIVACY_POLICY, 8],
])("%s", (title, subtitle, document, sectionCount) => {
  it("tem o mesmo título e subtítulo do site", () => {
    expect(document.title).toBe(title);
    expect(document.subtitle).toBe(subtitle);
  });

  it(`tem ${sectionCount} seções numeradas em ordem`, () => {
    expect(document.sections).toHaveLength(sectionCount);
    document.sections.forEach((section, index) => {
      expect(section.title.startsWith(`${index + 1}. `)).toBe(true);
    });
  });

  it("toda seção tem conteúdo", () => {
    for (const section of document.sections) {
      const hasContent = Boolean(section.body) || (section.bullets?.length ?? 0) > 0;
      expect(hasContent).toBe(true);
    }
  });
});
