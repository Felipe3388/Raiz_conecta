import { describe, expect, it } from "vitest";
import { activeNavId, badgeLabel, PRODUCER_NAV } from "./nav";

describe("PRODUCER_NAV", () => {
  it("segue a ordem das abas do app, com o Início no meio", () => {
    expect(PRODUCER_NAV.map((item) => item.id)).toEqual(["catalogo", "ofertas", "inicio", "entregas", "mais"]);
    expect(PRODUCER_NAV.filter((item) => item.home)).toHaveLength(1);
    expect(PRODUCER_NAV[2].home).toBe(true);
  });
});

describe("activeNavId", () => {
  it.each([
    ["/produtor", "inicio"],
    ["/produtor/", "inicio"],
    ["/produtor/catalogo", "catalogo"],
    ["/produtor/ofertas/", "ofertas"],
    ["/produtor/entregas", "entregas"],
    ["/produtor/mais", "mais"],
    ["/produtor/perfil", "mais"],
    ["/produtor/balancas", "mais"],
    ["/produtor/balancas/A4CF12B3D5E6", "mais"],
  ])("%s abre %s", (path, id) => {
    expect(activeNavId(path)).toBe(id);
  });

  it("fora da área do produtor não marca nada", () => {
    expect(activeNavId("/perfil")).toBeNull();
    expect(activeNavId("/produtores")).toBeNull();
  });
});

describe("badgeLabel", () => {
  it("só acrescenta o número quando há algo", () => {
    expect(badgeLabel("Ofertas", 0, "pedido para responder", "pedidos para responder")).toBe("Ofertas");
    expect(badgeLabel("Ofertas", 1, "pedido para responder", "pedidos para responder")).toBe("Ofertas, 1 pedido para responder");
    expect(badgeLabel("Ofertas", 3, "pedido para responder", "pedidos para responder")).toBe("Ofertas, 3 pedidos para responder");
  });
});
