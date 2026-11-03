import type { MuralItem } from "./mural";

export interface RevenueRow {
  produto: string;
  receita: number;
}

// Receita estimada por produto do que o produtor já garantiu (quantidade × preço médio do pedido), da maior para a menor.
export function revenueByProduct(minhas: MuralItem[], limit = 5): RevenueRow[] {
  const totals = new Map<string, number>();
  for (const item of minhas) {
    const receita = (item.minhaQuantidade ?? 0) * item.precoMedio;
    totals.set(item.produto, (totals.get(item.produto) ?? 0) + receita);
  }
  return [...totals.entries()]
    .map(([produto, receita]) => ({ produto, receita: Math.round(receita * 100) / 100 }))
    .filter((row) => row.receita > 0)
    .sort((a, b) => b.receita - a.receita || a.produto.localeCompare(b.produto, "pt-BR"))
    .slice(0, limit);
}

// "Responder primeiro": os pedidos abertos mais antigos esperam há mais tempo.
export function respondFirst(mural: MuralItem[], limit = 3): MuralItem[] {
  return [...mural].sort((a, b) => a.criadoEm.localeCompare(b.criadoEm)).slice(0, limit);
}

// Largura (0 a 100) da barra de cada linha, em relação à maior.
export function barWidths(rows: RevenueRow[]): number[] {
  const max = Math.max(...rows.map((row) => row.receita), 0);
  return rows.map((row) => (max > 0 ? Math.max(Math.round((row.receita / max) * 100), 4) : 0));
}
