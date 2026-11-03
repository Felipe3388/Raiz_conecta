"use client";

import { useCallback, useSyncExternalStore } from "react";
import { CART_KEY, addToCart, cartTotal, parseStoredCart, reconcile, removeItem, setQuantity, type CartItem, type CartProduct } from "@/lib/mercado/cart";

// A cotação fica no navegador (localStorage) para sobreviver a um recarregar e valer nas duas telas (catálogo e
// confirmação). Fora do navegador (ou com o armazenamento bloqueado) ela vale só até fechar a página.
const EMPTY: CartItem[] = [];
let memory: CartItem[] | null = null;
let rawSeen: string | null | undefined;
let snapshot: CartItem[] = EMPTY;
const listeners = new Set<() => void>();

function readStorage(): string | null {
  try {
    return localStorage.getItem(CART_KEY);
  } catch {
    return null;
  }
}

function currentSnapshot(): CartItem[] {
  if (memory) return memory;
  const raw = readStorage();
  // Só reconstrói a lista quando o texto guardado mudou: o React exige o mesmo objeto enquanto nada mudou.
  if (raw !== rawSeen) {
    rawSeen = raw;
    snapshot = parseStoredCart(raw);
  }
  return snapshot;
}

function write(next: CartItem[]) {
  try {
    if (next.length === 0) localStorage.removeItem(CART_KEY);
    else localStorage.setItem(CART_KEY, JSON.stringify(next));
    memory = null;
  } catch {
    memory = next;
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === CART_KEY || event.key === null) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useCart() {
  const cart = useSyncExternalStore(subscribe, currentSnapshot, () => EMPTY);

  const add = useCallback((product: CartProduct, qtd: number) => write(addToCart(currentSnapshot(), product, qtd)), []);
  const setQty = useCallback((id: number, qtd: number) => write(setQuantity(currentSnapshot(), id, qtd)), []);
  const remove = useCallback((id: number) => write(removeItem(currentSnapshot(), id)), []);
  const replace = useCallback((next: CartItem[]) => write(next), []);
  const clear = useCallback(() => write([]), []);
  // Confere a cotação com o catálogo de agora (produto fora da vitrine sai, preço novo entra). Só grava se algo mudou.
  const sync = useCallback((products: CartProduct[]) => {
    const result = reconcile(currentSnapshot(), products);
    if (result.removed.length > 0 || result.repriced) write(result.cart);
    return result;
  }, []);

  return { cart, total: cartTotal(cart), count: cart.length, add, setQty, remove, replace, clear, sync };
}
