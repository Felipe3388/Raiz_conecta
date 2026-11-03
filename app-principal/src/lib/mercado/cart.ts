// A cotação (carrinho) do mercado: regras puras, sem tela. A tela guarda a lista no navegador e manda ao servidor
// só `{ id, qtd }` de cada item: nome, unidade e preço de referência o servidor busca no catálogo.

export const CART_KEY = "carrinhoRaiz";
export const MAX_QTD = 100_000;

export interface CartProduct {
  cdProduto: number;
  nome: string | null;
  tipo?: string | null;
  preco: number | null;
  unidadePadrao: string | null;
  imagemUrl: string | null;
}

export interface CartItem {
  id: number;
  nome: string;
  preco: number;
  unidade: string;
  imagemUrl: string | null;
  qtd: number;
}

function clampQtd(value: number): number {
  return Math.min(MAX_QTD, Math.max(1, Math.floor(value)));
}

function toItem(product: CartProduct, qtd: number): CartItem {
  return {
    id: product.cdProduto,
    nome: product.nome ?? "Produto",
    preco: Number(product.preco) || 0,
    unidade: product.unidadePadrao || "Kg",
    imagemUrl: product.imagemUrl,
    qtd: clampQtd(qtd),
  };
}

// Lê o que ficou guardado no navegador, mesmo que seja de uma versão antiga (precoEstimado em vez de preco) ou esteja
// estragado. Item que não faz sentido é descartado em vez de quebrar a tela.
export function parseStoredCart(raw: string | null): CartItem[] {
  if (!raw) return [];
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(data)) return [];

  const items = new Map<number, CartItem>();
  for (const entry of data) {
    const e = (entry ?? {}) as Record<string, unknown>;
    const id = Number(e.id);
    const qtd = Number(e.qtd);
    if (!Number.isInteger(id) || id <= 0 || !Number.isFinite(qtd) || qtd < 1) continue;
    const price = Number(e.preco ?? e.precoEstimado);
    items.set(id, {
      id,
      nome: typeof e.nome === "string" && e.nome ? e.nome : "Produto",
      preco: Number.isFinite(price) && price >= 0 ? price : 0,
      unidade: typeof e.unidade === "string" && e.unidade ? e.unidade : "Kg",
      imagemUrl: typeof e.imagemUrl === "string" && e.imagemUrl ? e.imagemUrl : null,
      qtd: clampQtd(qtd),
    });
  }
  return [...items.values()];
}

export function addToCart(cart: CartItem[], product: CartProduct, qtd: number): CartItem[] {
  const existing = cart.find((item) => item.id === product.cdProduto);
  if (!existing) return [...cart, toItem(product, qtd)];
  return cart.map((item) => (item.id === product.cdProduto ? { ...item, qtd: clampQtd(item.qtd + qtd) } : item));
}

// Quantidade menor que 1 tira o item da cotação.
export function setQuantity(cart: CartItem[], id: number, qtd: number): CartItem[] {
  if (!Number.isFinite(qtd) || qtd < 1) return removeItem(cart, id);
  return cart.map((item) => (item.id === id ? { ...item, qtd: clampQtd(qtd) } : item));
}

export function removeItem(cart: CartItem[], id: number): CartItem[] {
  return cart.filter((item) => item.id !== id);
}

export function cartTotal(cart: CartItem[]): number {
  return Math.round(cart.reduce((total, item) => total + item.preco * item.qtd, 0) * 100) / 100;
}

export function toRequest(cart: CartItem[]): { carrinho: { id: number; qtd: number }[] } {
  return { carrinho: cart.map(({ id, qtd }) => ({ id, qtd })) };
}

// Confere a cotação com o catálogo de agora: produto que saiu da vitrine sai da cotação, preço e nome são atualizados.
export function reconcile(cart: CartItem[], products: CartProduct[]): { cart: CartItem[]; removed: string[]; repriced: boolean } {
  const byId = new Map(products.map((product) => [product.cdProduto, product]));
  const removed: string[] = [];
  let repriced = false;
  const next: CartItem[] = [];
  for (const item of cart) {
    const product = byId.get(item.id);
    if (!product) {
      removed.push(item.nome);
      continue;
    }
    const fresh = toItem(product, item.qtd);
    if (fresh.preco !== item.preco) repriced = true;
    next.push(fresh);
  }
  return { cart: next, removed, repriced };
}
