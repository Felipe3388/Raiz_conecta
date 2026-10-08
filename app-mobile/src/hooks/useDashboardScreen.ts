import { useMemo } from "react";
import { buildDashboard } from "@/lib/produtor/dashboard";
import { useProdutorData } from "./useProdutorData";

// Controller do Painel: resume, com os dados que o app já carregou, como está a atividade do produtor.
export function useDashboardScreen() {
  const { status, email, mural, offers, savedIds, reload } = useProdutorData();
  const summary = useMemo(
    () => buildDashboard({ mural, offers, email, savedProductCount: savedIds.length }),
    [mural, offers, email, savedIds],
  );
  return { status, summary, reload };
}
