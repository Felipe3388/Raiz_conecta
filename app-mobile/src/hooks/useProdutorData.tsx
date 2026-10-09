import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { hasSelectionChanged, selectedProductNames, toggleProductId } from "@/lib/produtor/catalog";
import { muralDemands, offerDemands } from "@/lib/produtor/demands";
import { getCatalogService, getDemandService, type CatalogGateway, type DemandGateway } from "@/services";
import type { CatalogProduct, Demand, ProductSuggestion } from "@/types/produtor";

type LoadStatus = "loading" | "ready" | "error";

interface ProdutorData {
  status: LoadStatus;
  email: string;
  products: CatalogProduct[];
  selectedIds: number[];
  savedIds: number[];
  hasUnsavedSelection: boolean;
  // Demandas que aparecem no Mural e as em que o produtor já ofertou.
  mural: Demand[];
  offers: Demand[];
  reload: () => Promise<void>;
  toggleProduct: (id: number) => void;
  // Devolve as escolhas que valiam antes de salvar, para quem quiser desfazer.
  saveSelection: () => Promise<number[]>;
  // Volta o catálogo salvo para uma lista de produtos (usado no "Desfazer").
  restoreSavedIds: (ids: number[]) => Promise<void>;
  // `preco` é o valor por unidade combinado na negociação; sem ele vale a estimativa do pedido.
  sendOffer: (demandId: string, quantity: number, preco?: number) => Promise<void>;
  cancelOffer: (demandId: string) => Promise<void>;
  // Devolve o código da sugestão, para ela poder ser retirada.
  suggestProduct: (suggestion: ProductSuggestion) => Promise<string>;
  withdrawSuggestion: (id: string) => Promise<void>;
}

const ProdutorDataContext = createContext<ProdutorData | null>(null);

interface ProviderProps {
  email: string;
  children: ReactNode;
  catalog?: CatalogGateway;
  demands?: DemandGateway;
}

// Dados da área do Produtor, compartilhados pelas abas: uma oferta feita no Mural já aparece em Ofertas.
export function ProdutorDataProvider({
  email,
  children,
  catalog = getCatalogService(),
  demands = getDemandService(),
}: ProviderProps) {
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [savedIds, setSavedIds] = useState<number[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [allDemands, setAllDemands] = useState<Demand[]>([]);

  const reload = useCallback(async () => {
    setStatus("loading");
    try {
      const [loadedProducts, loadedIds, loadedDemands] = await Promise.all([
        catalog.listProducts(),
        catalog.getMyProductIds(email),
        demands.listDemands(email),
      ]);
      setProducts(loadedProducts);
      setSavedIds(loadedIds);
      setSelectedIds(loadedIds);
      setAllDemands(loadedDemands);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, [catalog, demands, email]);

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

  const sendOffer = useCallback(
    async (demandId: string, quantity: number, preco?: number) => {
      await demands.sendOffer({ demandaId: demandId, quantidade: quantity, emailProdutor: email, preco });
      setAllDemands(await demands.listDemands(email));
    },
    [demands, email],
  );

  const cancelOffer = useCallback(
    async (demandId: string) => {
      await demands.cancelOffer({ demandaId: demandId, emailProdutor: email });
      setAllDemands(await demands.listDemands(email));
    },
    [demands, email],
  );

  const suggestProduct = useCallback(
    (suggestion: ProductSuggestion) => catalog.suggestProduct(email, suggestion),
    [catalog, email],
  );

  const withdrawSuggestion = useCallback((id: string) => catalog.withdrawSuggestion(email, id), [catalog, email]);

  const value = useMemo<ProdutorData>(() => {
    // O Mural usa as escolhas já salvas, não as que ainda estão sendo marcadas.
    const myProductNames = selectedProductNames(products, savedIds);
    return {
      status,
      email,
      products,
      selectedIds,
      savedIds,
      hasUnsavedSelection: hasSelectionChanged(savedIds, selectedIds),
      mural: muralDemands(allDemands, email, myProductNames),
      offers: offerDemands(allDemands, email),
      reload,
      toggleProduct,
      saveSelection,
      restoreSavedIds,
      sendOffer,
      cancelOffer,
      suggestProduct,
      withdrawSuggestion,
    };
  }, [
    status,
    email,
    products,
    selectedIds,
    savedIds,
    allDemands,
    reload,
    toggleProduct,
    saveSelection,
    restoreSavedIds,
    sendOffer,
    cancelOffer,
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
