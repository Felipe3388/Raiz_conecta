import { useMemo } from "react";
import { summarizeSignals } from "@/lib/pricing/insights";
import { buildDashboard } from "@/lib/produtor/dashboard";
import { useDeliveries } from "./useDeliveries";
import { useNow } from "./useNow";
import { usePricing } from "./usePricing";
import { useProdutorData } from "./useProdutorData";

// Controller do Painel: resume, com os dados que o app já carregou, como está a atividade do produtor.
export function useDashboardScreen() {
  const { status, proposals, savedIds, reload } = useProdutorData();
  const pricing = usePricing();
  const deliveries = useDeliveries();
  // O relógio corre só enquanto há proposta pendente: é ele que tira do resumo a que passou do prazo.
  const now = useNow(
    proposals.some((proposal) => proposal.status === "PENDENTE"),
    30_000,
  );
  const summary = useMemo(
    () => buildDashboard({ proposals, savedProductCount: savedIds.length, now }),
    [proposals, savedIds, now],
  );
  const signals = useMemo(() => summarizeSignals(pricing.insights), [pricing.insights]);

  return {
    status,
    summary,
    reload,
    // Quantos pedidos pedem ação até o próximo dia de entrega, e qual dia é esse.
    nextDelivery: deliveries.status === "ready" ? { pending: deliveries.pending, day: deliveries.nextDay } : null,
    now,
    // Preços e vendas dos produtos do catálogo, com a média de cada um.
    prices: { status: pricing.status, insights: pricing.insights, signals, reload: pricing.reload },
  };
}
