import type { CatalogProduct } from "@/types/produtor";
import { productEmoji, productVisual } from "./productVisual";

function product(nome: string, imagemUrl: string | null = null): CatalogProduct {
  return { cdProduto: 1, nome, tipo: "Fruta", imagemUrl, unidadePadrao: "Kg" };
}

describe("productVisual", () => {
  it("usa a foto quando o produto tem uma", () => {
    expect(productVisual(product("Tomate", "https://img.test/tomate.jpg"))).toEqual({
      kind: "image",
      uri: "https://img.test/tomate.jpg",
    });
  });

  it("sem foto, usa o emoji do produto", () => {
    expect(productVisual(product("Tomate"))).toEqual({ kind: "emoji", emoji: "🍅" });
    expect(productVisual(product("Maçã Gala"))).toEqual({ kind: "emoji", emoji: "🍎" });
    expect(productVisual(product("ABÓBORA"))).toEqual({ kind: "emoji", emoji: "🎃" });
  });

  it("produto desconhecido ganha uma plantinha", () => {
    expect(productVisual(product("Pitaya Vermelha"))).toEqual({ kind: "emoji", emoji: "🌱" });
  });

  it("foto vazia conta como sem foto", () => {
    expect(productVisual(product("Alface", "  "))).toEqual({ kind: "emoji", emoji: "🥬" });
  });
});

describe("productEmoji", () => {
  it("acha o emoji pelo nome, sem se importar com acento ou maiúscula", () => {
    expect(productEmoji("Maçã")).toBe("🍎");
    expect(productEmoji("  TOMATE cereja ")).toBe("🍅");
  });

  it("nome desconhecido ganha um broto", () => {
    expect(productEmoji("Jabuticaba")).toBe("🌱");
  });
});
