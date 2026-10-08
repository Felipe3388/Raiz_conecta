import { normalizeText } from "@/lib/text/normalize";
import type { Demand } from "@/types/produtor";
import { findOffer, remainingQuantity } from "./demands";

const MAX_OPPORTUNITIES = 3;

export interface Opportunity {
  demand: Demand;
  // Quanto ainda falta vezes o preço médio: o tamanho do negócio que está aberto.
  value: number;
}

export interface DashboardSummary {
  openDemands: number;
  offersCount: number;
  savedProducts: number;
  estimatedRevenue: number;
  revenueByProduct: { produto: string; revenue: number }[];
  opportunities: Opportunity[];
}

interface DashboardInput {
  mural: Demand[];
  offers: Demand[];
  email: string;
  savedProductCount: number;
}

const price = (demand: Demand) => demand.precoMedio ?? 0;

// Resumo do painel, calculado só com o que o app já carregou (nada de endpoint novo).
export function buildDashboard({ mural, offers, email, savedProductCount }: DashboardInput): DashboardSummary {
  const revenueByKey = new Map<string, { produto: string; revenue: number }>();
  let estimatedRevenue = 0;

  for (const demand of offers) {
    const revenue = (findOffer(demand, email)?.quantidade ?? 0) * price(demand);
    estimatedRevenue += revenue;

    const key = normalizeText(demand.produto);
    const current = revenueByKey.get(key);
    revenueByKey.set(key, { produto: current?.produto ?? demand.produto, revenue: (current?.revenue ?? 0) + revenue });
  }

  const opportunities = mural
    .map((demand) => ({ demand, value: remainingQuantity(demand) * price(demand) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, MAX_OPPORTUNITIES);

  return {
    openDemands: mural.length,
    offersCount: offers.length,
    savedProducts: savedProductCount,
    estimatedRevenue,
    revenueByProduct: [...revenueByKey.values()].sort((a, b) => b.revenue - a.revenue),
    opportunities,
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
