import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { hasSelectionChanged, toggleProductId } from "@/lib/produtor/catalog";
import { getCatalogService, getProposalService, type CatalogGateway, type ProposalGateway } from "@/services";
import type { CatalogProduct, ProductSuggestion } from "@/types/produtor";
import type { Proposal, ProposalResponse } from "@/types/proposal";

type LoadStatus = "loading" | "ready" | "error";

interface ProdutorData {
  status: LoadStatus;
  email: string;
  products: CatalogProduct[];
  selectedIds: number[];
  savedIds: number[];
  hasUnsavedSelection: boolean;
  // Propostas dos mercados: as que esperam resposta, as aceitas e as encerradas.
  proposals: Proposal[];
  reload: () => Promise<void>;
  toggleProduct: (id: number) => void;
  // Devolve as escolhas que valiam antes de salvar, para quem quiser desfazer.
  saveSelection: () => Promise<number[]>;
  // Volta o catálogo salvo para uma lista de produtos (usado no "Desfazer").
  restoreSavedIds: (ids: number[]) => Promise<void>;
  // Aceita ou recusa uma proposta. Devolve a proposta já atualizada.
  respondToProposal: (proposalId: string, response: ProposalResponse) => Promise<Proposal>;
  // Devolve o código da sugestão, para ela poder ser retirada.
  suggestProduct: (suggestion: ProductSuggestion) => Promise<string>;
  withdrawSuggestion: (id: string) => Promise<void>;
}

const ProdutorDataContext = createContext<ProdutorData | null>(null);

interface ProviderProps {
  email: string;
  children: ReactNode;
  catalog?: CatalogGateway;
  proposals?: ProposalGateway;
}

// Dados da área do Produtor, compartilhados pelas abas: uma proposta aceita em Ofertas já vira entrega em Entregas.
export function ProdutorDataProvider({
  email,
  children,
  catalog = getCatalogService(),
  proposals: proposalGateway = getProposalService(),
}: ProviderProps) {
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [savedIds, setSavedIds] = useState<number[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);

  const reload = useCallback(async () => {
    setStatus("loading");
    try {
      const [loadedProducts, loadedIds, loadedProposals] = await Promise.all([
        catalog.listProducts(),
        catalog.getMyProductIds(email),
        proposalGateway.listProposals(email),
      ]);
      setProducts(loadedProducts);
      setSavedIds(loadedIds);
      setSelectedIds(loadedIds);
      setProposals(loadedProposals);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, [catalog, proposalGateway, email]);

  useEffect(() => {
    reload();
  }, [reload]);

  const toggleProduct = useCallback((id: number) => {
    setSelectedIds((current) => toggleProductId(current, id));
  }, []);

  const saveSelection = useCallback(async () => {
    const previous = savedIds;
    await catalog.saveMyProductIds(email, selectedIds);
    setSavedIds(selectedIds);
    return previous;
  }, [catalog, email, selectedIds, savedIds]);

  const restoreSavedIds = useCallback(
    async (ids: number[]) => {
      await catalog.saveMyProductIds(email, ids);
      setSavedIds(ids);
      setSelectedIds(ids);
    },
    [catalog, email],
  );

  const respondToProposal = useCallback(
    async (proposalId: string, response: ProposalResponse) => {
      const updated = await proposalGateway.respond(email, proposalId, response);
      setProposals((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      return updated;
    },
    [proposalGateway, email],
  );

  const suggestProduct = useCallback(
    (suggestion: ProductSuggestion) => catalog.suggestProduct(email, suggestion),
    [catalog, email],
  );

  const withdrawSuggestion = useCallback((id: string) => catalog.withdrawSuggestion(email, id), [catalog, email]);

  const value = useMemo<ProdutorData>(() => {
    return {
      status,
      email,
      products,
      selectedIds,
      savedIds,
      hasUnsavedSelection: hasSelectionChanged(savedIds, selectedIds),
      proposals,
      reload,
      toggleProduct,
      saveSelection,
      restoreSavedIds,
      respondToProposal,
      suggestProduct,
      withdrawSuggestion,
    };
  }, [
    status,
    email,
    products,
    selectedIds,
    savedIds,
    proposals,
    reload,
    toggleProduct,
    saveSelection,
    restoreSavedIds,
    respondToProposal,
    suggestProduct,
    withdrawSuggestion,
  ]);

  return <ProdutorDataContext.Provider value={value}>{children}</ProdutorDataContext.Provider>;
}

export function useProdutorData(): ProdutorData {
  const context = useContext(ProdutorDataContext);
  if (!context) throw new Error("useProdutorData deve ser usado dentro de ProdutorDataProvider.");
  return context;
}
