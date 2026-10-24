import { useMemo, useState } from "react";
import { deliveryDayLabel } from "@/lib/delivery/schedule";
import { demandByProduct } from "@/lib/produtor/demand";
import {
  canAnswer,
  filterProposals,
  fullQuantities,
  groupByMarket,
  marketKey,
  proposalCounts,
  quantitiesError,
  searchProposals,
  sortProposals,
  type ProposalFilter,
  type ProposalSort,
} from "@/lib/produtor/proposals";
import type { Proposal, ProposalQuantities, ProposalResponse } from "@/types/proposal";
import { useNow } from "./useNow";
import { usePricing } from "./usePricing";
import { useProdutorData } from "./useProdutorData";
import { useToast } from "./useToast";

// O que a pessoa está prestes a enviar para um pedido, esperando a confirmação.
interface Asking {
  proposal: Proposal;
  response: ProposalResponse;
}

const NO_CHOICE: ProposalQuantities = {};

// Controller da aba Ofertas: os pedidos dos mercados (preço fixo, 30 minutos para responder), agrupados por mercado.
// Em cada pedido a pessoa escolhe quanto aceita de cada produto (pode ser só uma parte: o resto segue para outros
// produtores). A resposta pede confirmação, porque não tem volta.
export function useOffersScreen() {
  const data = useProdutorData();
  const pricing = usePricing();
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ProposalFilter>("all");
  const [sort, setSort] = useState<ProposalSort>("priority");
  // Quantidades escolhidas, por pedido e por produto. Cada pedido guarda as suas, sem misturar com os outros.
  const [choices, setChoices] = useState<Record<string, ProposalQuantities>>({});
  // Mercados que a pessoa abriu. Todos começam fechados: é preciso tocar no mercado para ver os pedidos e os produtos.
  const [opened, setOpened] = useState<Record<string, boolean>>({});
  const [asking, setAsking] = useState<Asking | null>(null);
  const [isResponding, setIsResponding] = useState(false);
  // O resumo da demanda por produto começa fechado (só o total).
  const [demandOpen, setDemandOpen] = useState(false);

  // O relógio só corre enquanto há um pedido pendente: é ele que atualiza as contagens regressivas.
  const hasPending = data.proposals.some((proposal) => proposal.status === "PENDENTE");
  const now = useNow(hasPending);

  const searched = useMemo(() => searchProposals(data.proposals, query), [data.proposals, query]);
  const visible = sortProposals(filterProposals(searched, filter, now), sort, now);
  const markets = groupByMarket(visible);
  const counts = proposalCounts(searched, now);
  // A demanda considera todos os pedidos (não só os da busca) e o que está sendo escolhido agora.
  const demand = demandByProduct(data.proposals, choices, now);

  const isOpen = (marketKey: string): boolean => opened[marketKey] ?? false;

  function toggleMarket(marketKey: string) {
    setOpened((current) => ({ ...current, [marketKey]: !current[marketKey] }));
  }

  const quantitiesOf = (proposal: Proposal): ProposalQuantities => choices[proposal.id] ?? NO_CHOICE;

  function setQuantity(proposal: Proposal, itemId: string, value: number) {
    setChoices((current) => ({ ...current, [proposal.id]: { ...current[proposal.id], [itemId]: value } }));
  }

  function acceptEverything(proposal: Proposal) {
    setChoices((current) => ({ ...current, [proposal.id]: fullQuantities(proposal) }));
  }

  function clearChoices(proposal: Proposal) {
    setChoices((current) => ({ ...current, [proposal.id]: {} }));
  }

  function askToAccept(proposal: Proposal) {
    const quantities = quantitiesOf(proposal);
    const error = quantitiesError(proposal, quantities);
    if (error) {
      toast.show("warning", error);
      return;
    }
    setAsking({ proposal, response: { answer: "ACEITAR", quantities } });
  }

  function askToRefuse(proposal: Proposal) {
    setAsking({ proposal, response: { answer: "RECUSAR" } });
  }

  async function confirm() {
    if (!asking) return;
    const { proposal, response } = asking;
    if (!canAnswer(proposal, new Date())) {
      setAsking(null);
      toast.show("warning", "O prazo acabou", "Este pedido foi para outro produtor.");
      return;
    }

    setIsResponding(true);
    try {
      await data.respondToProposal(proposal.id, response);
      setAsking(null);
      // O mercado fica aberto depois de responder, para a pessoa ver o resultado no próprio pedido.
      setOpened((current) => ({ ...current, [marketKey(proposal.mercado)]: true }));
      setChoices(({ [proposal.id]: _answered, ...others }) => others);
      // O preço sugerido aprende com cada resposta (só para os adms): produto aceito conta como aceito, o que ficou
      // com 0 como recusado. Se falhar, não atrapalha o produtor.
      for (const item of proposal.itens) {
        const accepted = response.answer === "ACEITAR" && (response.quantities[item.id] ?? 0) > 0;
        void pricing
          .recordResponse({ produto: item.produto, price: item.preco, answer: accepted ? "accepted" : "rejected" })
          .catch(() => {});
      }
      if (response.answer === "ACEITAR") {
        toast.show(
          "success",
          "Pedido aceito!",
          `${proposal.mercado}, entrega ${deliveryDayLabel(proposal.entrega, new Date()).toLowerCase()}.`,
        );
      } else {
        toast.show("success", "Pedido recusado.");
      }
    } catch (error) {
      setAsking(null);
      toast.show("error", error instanceof Error ? error.message : "Erro de conexão.");
    } finally {
      setIsResponding(false);
    }
  }

  return {
    status: data.status,
    reload: data.reload,
    now,
    markets,
    orderCount: visible.length,
    counts,
    totalCount: data.proposals.length,
    query,
    setQuery,
    filter,
    setFilter,
    sort,
    setSort,
    demand,
    demandOpen,
    toggleDemand: () => setDemandOpen((open) => !open),
    isOpen,
    toggleMarket,
    quantitiesOf,
    setQuantity,
    acceptEverything,
    clearChoices,
    asking,
    askToAccept,
    askToRefuse,
    cancelAsking: () => setAsking(null),
    confirm,
    isResponding,
  };
}
