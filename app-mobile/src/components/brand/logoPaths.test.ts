import { LOGO_PATH, LOGO_VIEWBOX } from "./logoPaths";

describe("logo do Raiz Conecta", () => {
  it("tem o desenho e uma área de visão com tamanho", () => {
    expect(LOGO_PATH.startsWith("M ")).toBe(true);
    expect(LOGO_PATH.length).toBeGreaterThan(1000);
    expect(LOGO_VIEWBOX.width).toBeGreaterThan(0);
    expect(LOGO_VIEWBOX.height).toBeGreaterThan(LOGO_VIEWBOX.width);
  });
});
