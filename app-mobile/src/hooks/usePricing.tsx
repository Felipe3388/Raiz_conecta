import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { priceKey } from "@/lib/pricing/price";
import type { SuggestedPrice } from "@/lib/pricing/suggestion";
import { getPricingService, type PriceResponse, type PricingGateway } from "@/services";

type LoadStatus = "loading" | "ready" | "error";

interface PricingData {
  status: LoadStatus;
  // O preço que o produtor pede por um produto (preço ofertado), ou null se não definiu.
  priceOf: (produto: string) => number | null;
  // A média que a plataforma sugere para um produto: só uma referência, não é o preço dele.
  suggestedOf: (produto: string) => SuggestedPrice | null;
  setPrice: (produto: string, price: number | null) => Promise<void>;
  recordResponse: (response: PriceResponse) => Promise<void>;
  reload: () => Promise<void>;
}

const PricingContext = createContext<PricingData | null>(null);

interface ProviderProps {
  email: string;
  children: ReactNode;
  pricing?: PricingGateway;
}

// Preços da área do Produtor: o preço que ele pede por produto e a média sugerida pela plataforma.
export function PricingProvider({ email, children, pricing = getPricingService() }: ProviderProps) {
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [myPrices, setMyPrices] = useState<Record<string, number>>({});
  const [suggested, setSuggested] = useState<Record<string, SuggestedPrice>>({});

  const fetchAll = useCallback(async () => {
    const [prices, suggestions] = await Promise.all([pricing.getMyPrices(email), pricing.getSuggestedPrices()]);
    setMyPrices(prices);
    setSuggested(suggestions);
  }, [pricing, email]);

  const reload = useCallback(async () => {
    setStatus("loading");
    try {
      await fetchAll();
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, [fetchAll]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const setPrice = useCallback(
    async (produto: string, price: number | null) => {
      await pricing.setMyPrice(email, produto, price);
      await fetchAll();
    },
    [pricing, email, fetchAll],
  );

  const recordResponse = useCallback(
    async (response: PriceResponse) => {
      await pricing.recordResponse(email, response);
      // O preço sugerido muda com cada resposta; as telas já mostram o novo valor.
      await fetchAll();
    },
    [pricing, email, fetchAll],
  );

  const value = useMemo<PricingData>(() => {
    return {
      status,
      priceOf: (produto) => myPrices[priceKey(produto)] ?? null,
      suggestedOf: (produto) => suggested[priceKey(produto)] ?? null,
      setPrice,
      recordResponse,
      reload,
    };
  }, [status, myPrices, suggested, setPrice, recordResponse, reload]);

  return <PricingContext.Provider value={value}>{children}</PricingContext.Provider>;
}

export function usePricing(): PricingData {
  const context = useContext(PricingContext);
  if (!context) throw new Error("usePricing deve ser usado dentro de PricingProvider.");
  return context;
}
