import {
  buildLinkKey,
  cleanScaleName,
  isValidDeviceId,
  isValidPairingCode,
  maskDeviceId,
  maskPairingCode,
  MAX_SCALE_NAME_LENGTH,
  normalizeDeviceId,
  normalizePairingCode,
  parseLabelText,
  producerRef,
  provisionalScaleName,
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

describe("endereço e código da etiqueta", () => {
  it("valida o endereço MAC em qualquer escrita", () => {
    expect(isValidDeviceId("A4:CF:12:9B:07:E1")).toBe(true);
    expect(isValidDeviceId("a4-cf-12-9b-07-e1")).toBe(true);
    expect(isValidDeviceId("A4CF129B07E")).toBe(false);
    expect(isValidDeviceId("ZZ:CF:12:9B:07:E1")).toBe(false);
    expect(isValidDeviceId("")).toBe(false);
  });

  it("mascara o endereço enquanto digita", () => {
    expect(maskDeviceId("")).toBe("");
    expect(maskDeviceId("a")).toBe("A");
    expect(maskDeviceId("a4cf129")).toBe("A4:CF:12:9");
    expect(maskDeviceId("a4:cf:12:9b:07:e1:ff")).toBe("A4:CF:12:9B:07:E1");
    expect(maskDeviceId("xyz")).toBe("");
  });

  it("mascara e valida o código (8 caracteres)", () => {
    expect(normalizePairingCode("k7m2-q9xt!")).toBe("K7M2Q9XT");
    expect(normalizePairingCode("K7M2Q9XT99")).toBe("K7M2Q9XT");
    expect(maskPairingCode("k7m")).toBe("K7M");
    expect(maskPairingCode("k7m2q")).toBe("K7M2-Q");
    expect(isValidPairingCode("K7M2-Q9XT")).toBe(true);
    expect(isValidPairingCode("K7M2-Q9")).toBe(false);
  });

  it("lê o texto do QR Code da etiqueta", () => {
    expect(parseLabelText("RC:A4CF129B07E1:K7M2Q9XT")).toEqual({ deviceId: "A4:CF:12:9B:07:E1", code: "K7M2-Q9XT" });
    expect(parseLabelText(" rc:a4:cf:12:9b:07:e1:k7m2-q9xt ")).toEqual({ deviceId: "A4:CF:12:9B:07:E1", code: "K7M2-Q9XT" });
    expect(parseLabelText("A4CF129B07E1")).toBeNull();
    expect(parseLabelText("RC:A4CF129B07E1:K7M2")).toBeNull();
    expect(parseLabelText("RC:123:K7M2Q9XT")).toBeNull();
  });

  it("dá um nome provisório pelo fim do endereço", () => {
    expect(provisionalScaleName("A4:CF:12:9B:07:E1")).toBe("Balança 07E1");
  });
});
