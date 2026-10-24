import type { CatalogProduct } from "@/types/produtor";

// Todo produto é vendido por kg.
function product(cdProduto: number, nome: string, tipo: string): CatalogProduct {
  return { cdProduto, nome, tipo, unidadePadrao: "kg", imagemUrl: null };
}

// Catálogo de exemplo. Sem foto: o app mostra o emoji do alimento (ver productVisual).
export const MOCK_PRODUCTS: CatalogProduct[] = [
  product(1, "Tomate", "Legume"),
  product(2, "Alface", "Verdura"),
  product(3, "Cenoura", "Legume"),
  product(4, "Batata", "Legume"),
  product(5, "Cebola", "Legume"),
  product(6, "Banana", "Fruta"),
  product(7, "Maçã", "Fruta"),
  product(8, "Laranja", "Fruta"),
  product(9, "Mandioca", "Raiz"),
  product(10, "Milho Verde", "Grão"),
  product(11, "Abóbora", "Legume"),
  product(12, "Morango", "Fruta"),
  product(13, "Limão", "Fruta"),
  product(14, "Couve", "Verdura"),
  product(15, "Brócolis", "Verdura"),
  product(16, "Pimentão", "Legume"),
  product(17, "Abacaxi", "Fruta"),
  product(18, "Pepino", "Legume"),
];

// Produtos que o produtor de exemplo já cultiva (Tomate, Alface, Cenoura, Banana e Mandioca).
export const DEFAULT_MY_PRODUCT_IDS = [1, 2, 3, 6, 9];
