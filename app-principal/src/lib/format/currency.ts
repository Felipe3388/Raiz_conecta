// R$ 1.234,50 — o mesmo formato do app mobile.
const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatBRL(value: number): string {
  return BRL.format(Number.isFinite(value) ? value : 0).replace(/ /g, " ");
}

// 1 → "1 Kg", 1250 → "1.250 Kg": a quantidade de um pedido com a unidade dele.
export function formatQuantity(quantity: number, unit: string): string {
  return `${new Intl.NumberFormat("pt-BR").format(quantity)} ${unit}`;
}
