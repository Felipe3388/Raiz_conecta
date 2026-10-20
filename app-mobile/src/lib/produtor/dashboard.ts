import { normalizeText } from "@/lib/text/normalize";
import type { Proposal } from "@/types/proposal";
import { acceptedItems, acceptedTotal, effectiveStatus, sortProposals } from "./proposals";

const MAX_URGENT = 3;

export interface DashboardSummary {
  // Propostas esperando resposta dentro do prazo e propostas aceitas (planejadas para entregar).
  pendingCount: number;
  acceptedCount: number;
  savedProducts: number;
  estimatedRevenue: number;
  revenueByProduct: { produto: string; revenue: number }[];
  // As pendentes com o prazo mais curto: o que responder primeiro.
  urgent: Proposal[];
}

interface DashboardInput {
  proposals: Proposal[];
  savedProductCount: number;
  now: Date;
}

// Resumo do painel, calculado só com o que o app já carregou (nada de endpoint novo). A receita vem do que foi
// aceito em cada pedido: o preço é fixo, então a conta é quantidade aceita vezes preço.
export function buildDashboard({ proposals, savedProductCount, now }: DashboardInput): DashboardSummary {
  const revenueByKey = new Map<string, { produto: string; revenue: number }>();
  let estimatedRevenue = 0;
  const accepted = proposals.filter((proposal) => proposal.status === "ACEITA");

  for (const proposal of accepted) {
    estimatedRevenue += acceptedTotal(proposal);

    for (const item of acceptedItems(proposal)) {
      const revenue = (item.aceita ?? 0) * item.preco;
      const key = normalizeText(item.produto);
      const current = revenueByKey.get(key);
      revenueByKey.set(key, {
        produto: current?.produto ?? item.produto,
        revenue: (current?.revenue ?? 0) + revenue,
      });
    }
  }

  const pending = proposals.filter((proposal) => effectiveStatus(proposal, now) === "PENDENTE");

  return {
    pendingCount: pending.length,
    acceptedCount: accepted.length,
    savedProducts: savedProductCount,
    estimatedRevenue,
    revenueByProduct: [...revenueByKey.values()].sort((a, b) => b.revenue - a.revenue),
    urgent: sortProposals(pending, "priority", now).slice(0, MAX_URGENT),
  };
}

// Barra mínima: um valor pequeno ainda precisa ser visto, não pode sumir.
export const MIN_BAR_SHARE = 0.04;

// Quanto da largura a barra ocupa (0 a 1), com o maior valor da lista como referência.
export function barShare(value: number, max: number): number {
  if (value <= 0 || max <= 0) return 0;
  return Math.min(1, Math.max(value / max, MIN_BAR_SHARE));
}

export interface ChartRow {
  produto: string;
  revenue: number;
}

const OTHERS_LABEL = "Outros produtos";

// Linhas do gráfico: os maiores produtos e, se sobrar, uma linha "Outros produtos" com a soma do resto.
export function chartRows(revenueByProduct: ChartRow[], limit: number): ChartRow[] {
  const withRevenue = revenueByProduct.filter((row) => row.revenue > 0);
  if (withRevenue.length <= limit) return withRevenue;
  const shown = withRevenue.slice(0, limit - 1);
  const others = withRevenue.slice(limit - 1).reduce((sum, row) => sum + row.revenue, 0);
  return [...shown, { produto: OTHERS_LABEL, revenue: others }];
}
