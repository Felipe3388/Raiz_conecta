import { useMemo } from "react";
import { summarizeSignals } from "@/lib/pricing/insights";
import { buildDashboard } from "@/lib/produtor/dashboard";
import { useDeliveries } from "./useDeliveries";
import { usePricing } from "./usePricing";
import { useProdutorData } from "./useProdutorData";

// Controller do Painel: resume, com os dados que o app já carregou, como está a atividade do produtor.
export function useDashboardScreen() {
  const { status, email, mural, offers, savedIds, reload } = useProdutorData();
  const pricing = usePricing();
  const deliveries = useDeliveries();
  const summary = useMemo(
    () => buildDashboard({ mural, offers, email, savedProductCount: savedIds.length }),
    [mural, offers, email, savedIds],
  );
  const signals = useMemo(() => summarizeSignals(pricing.insights), [pricing.insights]);

  return {
    status,
    summary,
    reload,
    // Quantas entregas pedem ação do produtor hoje (de hoje ou atrasadas).
    deliveriesToday: deliveries.status === "ready" ? deliveries.pending : null,
    // Preços e vendas dos produtos do catálogo, com a média de cada um.
    prices: { status: pricing.status, insights: pricing.insights, signals, reload: pricing.reload },
  };
}
