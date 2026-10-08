import { duplicateRoutes, routeUrl } from "./routeFiles";

describe("routeUrl", () => {
  it("ignora os grupos entre parênteses e a extensão", () => {
    expect(routeUrl("(produtor)/(tabs)/mural.tsx")).toBe("/mural");
    expect(routeUrl("(produtor)/perfil.tsx")).toBe("/perfil");
  });

  it("trata index como a raiz do grupo", () => {
    expect(routeUrl("index.tsx")).toBe("/");
    expect(routeUrl("(auth)/index.tsx")).toBe("/");
  });

  it("mantém pastas comuns", () => {
    expect(routeUrl("(produtor)/pedido/[id].tsx")).toBe("/pedido/[id]");
  });
});

describe("duplicateRoutes", () => {
  it("não acusa nada quando cada endereço tem um só arquivo", () => {
    expect(duplicateRoutes(["(auth)/login.tsx", "(produtor)/(tabs)/mural.tsx", "(produtor)/perfil.tsx"])).toEqual([]);
  });

  it("acusa dois arquivos que viram o mesmo endereço (sobra de versão antiga)", () => {
    expect(duplicateRoutes(["(produtor)/mural.tsx", "(produtor)/(tabs)/mural.tsx", "(produtor)/perfil.tsx"])).toEqual([
      { url: "/mural", files: ["(produtor)/(tabs)/mural.tsx", "(produtor)/mural.tsx"] },
    ]);
  });

  it("não conta os _layout nem arquivos que não são telas", () => {
    expect(duplicateRoutes(["(produtor)/_layout.tsx", "(auth)/_layout.tsx", "+not-found.tsx"])).toEqual([]);
  });
});
