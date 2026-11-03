import { describe, expect, it, vi } from "vitest";
import { clearLegacySession, homeFor, isSessionRole } from "./client";

describe("homeFor", () => {
  it("leva cada perfil para a sua área", () => {
    expect(homeFor("admin")).toBe("/admin");
    expect(homeFor("produtor")).toBe("/produtor");
    expect(homeFor("mercado")).toBe("/catalogo");
    expect(homeFor("outro")).toBe("/");
  });
});

describe("isSessionRole", () => {
  it("só aceita os três perfis", () => {
    expect(["admin", "produtor", "mercado"].every(isSessionRole)).toBe(true);
    expect([null, undefined, "root", 1].some(isSessionRole)).toBe(false);
  });
});

describe("clearLegacySession", () => {
  it("apaga o token e os dados que versões antigas guardavam no navegador", () => {
    const storage = { removeItem: vi.fn() };
    clearLegacySession(storage);
    expect(storage.removeItem.mock.calls.map((call) => call[0]).sort()).toEqual(["token", "userEmail", "userName", "userRole"]);
  });
});
