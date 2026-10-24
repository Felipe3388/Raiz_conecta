import {
  buildLinkKey,
  cleanScaleName,
  MAX_SCALE_NAME_LENGTH,
  normalizeDeviceId,
  producerRef,
  scaleDisplayName,
} from "./scaleLink";

describe("normalizeDeviceId", () => {
  it("tira os separadores e põe em maiúsculas", () => {
    expect(normalizeDeviceId("a4:cf:12:9b:07:e1")).toBe("A4CF129B07E1");
    expect(normalizeDeviceId("A4-CF-12-9B-07-E1")).toBe("A4CF129B07E1");
  });
});

describe("buildLinkKey", () => {
  it("junta o id do produtor e o da balança", () => {
    expect(buildLinkKey("1", "A4:CF:12:9B:07:E1")).toBe("P1-BA4CF129B07E1");
  });

  it("o mesmo par dá sempre a mesma chave, em qualquer escrita do endereço", () => {
    expect(buildLinkKey("ab12", "a4-cf-12-9b-07-e1")).toBe(buildLinkKey("AB12", "A4:CF:12:9B:07:E1"));
  });

  it("outro produtor, outra chave para a mesma balança", () => {
    expect(buildLinkKey("1", "A4:CF:12:9B:07:E1")).not.toBe(buildLinkKey("2", "A4:CF:12:9B:07:E1"));
  });
});

describe("producerRef", () => {
  it("é estável e não depende de maiúsculas nem de espaços", () => {
    expect(producerRef(" Ana@Sitio.com ")).toBe(producerRef("ana@sitio.com"));
  });

  it("tem 6 caracteres e muda de uma conta para outra", () => {
    expect(producerRef("ana@sitio.com")).toHaveLength(6);
    expect(producerRef("ana@sitio.com")).not.toBe(producerRef("bia@sitio.com"));
  });
});

describe("nome da balança", () => {
  it("arruma o que foi digitado", () => {
    expect(cleanScaleName("  Balança   da   horta ")).toBe("Balança da horta");
    expect(cleanScaleName("x".repeat(50))).toBe("x".repeat(MAX_SCALE_NAME_LENGTH));
  });

  it("vazio volta ao nome original", () => {
    expect(cleanScaleName("   ")).toBeNull();
  });

  it("mostra o nome do produtor ou, sem ele, o da balança", () => {
    expect(scaleDisplayName({ deviceName: "Balança RC-01", nickname: "Da horta" })).toBe("Da horta");
    expect(scaleDisplayName({ deviceName: "Balança RC-01", nickname: null })).toBe("Balança RC-01");
  });
});
