import type { CatalogProduct } from "@/types/produtor";

function product(
  cdProduto: number,
  nome: string,
  tipo: string,
  unidadePadrao: string,
): CatalogProduct {
  return { cdProduto, nome, tipo, unidadePadrao, imagemUrl: null };
}

// Catálogo de exemplo. Sem foto: o app mostra o emoji do alimento (ver productVisual).
export const MOCK_PRODUCTS: CatalogProduct[] = [
  product(1, "Tomate", "Legume", "Caixa"),
  product(2, "Alface", "Verdura", "Maço"),
  product(3, "Cenoura", "Legume", "Kg"),
  product(4, "Batata", "Legume", "Kg"),
  product(5, "Cebola", "Legume", "Kg"),
  product(6, "Banana", "Fruta", "Caixa"),
  product(7, "Maçã", "Fruta", "Caixa"),
  product(8, "Laranja", "Fruta", "Caixa"),
  product(9, "Mandioca", "Raiz", "Kg"),
  product(10, "Milho Verde", "Grão", "Espiga"),
  product(11, "Abóbora", "Legume", "Kg"),
  product(12, "Morango", "Fruta", "Bandeja"),
  product(13, "Limão", "Fruta", "Kg"),
  product(14, "Couve", "Verdura", "Maço"),
  product(15, "Brócolis", "Verdura", "Maço"),
  product(16, "Pimentão", "Legume", "Kg"),
  product(17, "Abacaxi", "Fruta", "Unidade"),
  product(18, "Pepino", "Legume", "Kg"),
];

// Produtos que o produtor de exemplo já cultiva (Tomate, Alface, Cenoura, Banana e Mandioca).
export const DEFAULT_MY_PRODUCT_IDS = [1, 2, 3, 6, 9];
