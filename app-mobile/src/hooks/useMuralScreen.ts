import { useMemo, useState } from "react";
import { formatBRL } from "@/lib/format/currency";
import { canOffer, filterByProduct, remainingQuantity } from "@/lib/produtor/demands";
import { sortMural, type MuralSort } from "@/lib/produtor/demandView";
import type { Demand } from "@/types/produtor";
import { usePriceEditing } from "./usePriceEditing";
import { useProdutorData } from "./useProdutorData";
import { useToast } from "./useToast";
import { useUndo } from "./useUndo";

// Uma oferta em negociação: o pedido e quanto o produtor quer mandar.
interface PendingNegotiation {
  demand: Demand;
  quantity: number;
}

// Controller do Mural de Oportunidades: busca, ordem, quantidade de cada oferta, negociação do preço e envio.
export function useMuralScreen() {
  const data = useProdutorData();
  const toast = useToast();
  const undo = useUndo();
  const prices = usePriceEditing();
  const [negotiation, setNegotiation] = useState<PendingNegotiation | null>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<MuralSort>("recent");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [sendingId, setSendingId] = useState<string | null>(null);

  const demands = useMemo(() => sortMural(filterByProduct(data.mural, query), sort), [data.mural, query, sort]);

  function setQuantity(demandId: string, quantity: number) {
    setQuantities((current) => ({ ...current, [demandId]: quantity }));
  }

  // Envia a oferta. `preco` é o valor combinado na negociação; sem ele vale a estimativa do pedido.
  async function send(demand: Demand, quantity: number, preco?: number) {
    setSendingId(demand.id);
    try {
      await data.sendOffer(demand.id, quantity, preco);
      setNegotiation(null);
      setQuantity(demand.id, 0);
      undo.announce({
        title: "Negócio registrado!",
        description:
          preco === undefined
            ? "O mercado será notificado."
            : `${quantity} ${demand.unidade.toLowerCase()} a ${formatBRL(preco)}. O mercado será notificado.`,
        label: `Oferta de ${demand.produto}`,
        revert: () => data.cancelOffer(demand.id),
      });
    } catch (error) {
      toast.show("error", error instanceof Error ? error.message : "Erro de conexão.");
    } finally {
      setSendingId(null);
    }
  }

  // Com o preço do produtor definido, o mercado negocia (começa baixo e sobe); sem ele, vale a estimativa.
  async function offer(demand: Demand) {
    const quantity = quantities[demand.id] ?? 0;
    if (!canOffer(quantity, remainingQuantity(demand))) {
      toast.show("warning", "Insira uma quantidade válida.");
      return;
    }

    if (prices.priceOf(demand.produto) === null || demand.precoMedio === null) {
      await send(demand, quantity);
      return;
    }
    setNegotiation({ demand, quantity });
  }

  function editPrice(demand: Demand) {
    prices.edit({ produto: demand.produto, unidade: demand.unidade, marketPrice: demand.precoMedio });
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
    // Preço que o produtor pede por um produto do Mural e a folha para mudá-lo.
    priceOf: (demand: Demand) => prices.priceOf(demand.produto),
    editPrice,
    priceEditor: prices,
    // A negociação aberta, se houver.
    negotiation,
    confirmDeal: (price: number) =>
      negotiation ? send(negotiation.demand, negotiation.quantity, price) : Promise.resolve(),
    closeNegotiation: () => setNegotiation(null),
    changePriceFromNegotiation: () => {
      if (!negotiation) return;
      const { demand } = negotiation;
      setNegotiation(null);
      editPrice(demand);
    },
    reload: data.reload,
  };
}
