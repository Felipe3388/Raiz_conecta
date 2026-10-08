import { useMemo, useState } from "react";
import { canOffer, filterByProduct, remainingQuantity } from "@/lib/produtor/demands";
import { sortMural, type MuralSort } from "@/lib/produtor/demandView";
import type { Demand } from "@/types/produtor";
import { useProdutorData } from "./useProdutorData";
import { useToast } from "./useToast";

// Controller do Mural de Oportunidades: busca, ordem, quantidade de cada oferta e envio.
export function useMuralScreen() {
  const data = useProdutorData();
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<MuralSort>("recent");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [sendingId, setSendingId] = useState<string | null>(null);

  const demands = useMemo(
    () => sortMural(filterByProduct(data.mural, query), sort),
    [data.mural, query, sort],
  );

  function setQuantity(demandId: string, quantity: number) {
    setQuantities((current) => ({ ...current, [demandId]: quantity }));
  }

  async function offer(demand: Demand) {
    const quantity = quantities[demand.id] ?? 0;
    if (!canOffer(quantity, remainingQuantity(demand))) {
      toast.show("warning", "Insira uma quantidade válida.");
      return;
    }

    setSendingId(demand.id);
    try {
      await data.sendOffer(demand.id, quantity);
      toast.show("success", "Negócio registrado!", "O mercado será notificado.");
      setQuantity(demand.id, 0);
    } catch (error) {
      toast.show("error", error instanceof Error ? error.message : "Erro de conexão.");
    } finally {
      setSendingId(null);
    }
  }

  return {
    status: data.status,
    email: data.email,
    demands,
    totalCount: data.mural.length,
    // Sem produtos salvos no catálogo, o Mural fica "escondido" até a pessoa escolher o que produz.
    hasNoProducts: data.savedIds.length === 0,
    query,
    setQuery,
    sort,
    setSort,
    quantityOf: (demandId: string) => quantities[demandId] ?? 0,
    setQuantity,
    sendingId,
    offer,
    reload: data.reload,
  };
}
