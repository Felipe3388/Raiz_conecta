import { parseEnv } from "./env";

describe("parseEnv", () => {
  it("retorna a URL da API informada", () => {
    expect(parseEnv({ apiUrl: "https://api.raizconecta.com.br" })).toEqual({
      apiUrl: "https://api.raizconecta.com.br",
      useMocks: false,
    });
  });

  it("remove barras finais da URL", () => {
    expect(parseEnv({ apiUrl: "http://10.0.2.2:3000//" }).apiUrl).toBe(
      "http://10.0.2.2:3000",
    );
  });

  it("falha quando a URL não foi definida", () => {
    expect(() => parseEnv({ apiUrl: undefined })).toThrow("EXPO_PUBLIC_API_URL");
    expect(() => parseEnv({ apiUrl: "   " })).toThrow("EXPO_PUBLIC_API_URL");
  });

  it("falha quando a URL não começa com http(s)", () => {
    expect(() => parseEnv({ apiUrl: "localhost:3000" })).toThrow("http");
  });

  describe("modo simulado (EXPO_PUBLIC_USE_MOCKS)", () => {
    it("fica desligado por padrão", () => {
      expect(parseEnv({ apiUrl: "http://x.com", useMocks: undefined }).useMocks).toBe(false);
      expect(parseEnv({ apiUrl: "http://x.com", useMocks: "false" }).useMocks).toBe(false);
    });

    it("liga com o valor 'true'", () => {
      expect(parseEnv({ apiUrl: "http://x.com", useMocks: "true" }).useMocks).toBe(true);
    });

    it("dispensa a URL da API quando ligado", () => {
      expect(parseEnv({ apiUrl: undefined, useMocks: "true" })).toEqual({
        apiUrl: "",
        useMocks: true,
      });
    });
  });
});
