import { useCallback, useEffect, useState } from "react";
import { newestFirst } from "@/lib/produtor/suggestionStatus";
import { getCatalogService, type CatalogGateway } from "@/services";
import type { SuggestionRecord } from "@/types/produtor";
import { useProdutorData } from "./useProdutorData";

type LoadStatus = "loading" | "ready" | "error";

// Controller de "Minhas sugestões": carrega a lista toda vez que a janela abre.
export function useMySuggestions(active: boolean, gateway: CatalogGateway = getCatalogService()) {
  const { email } = useProdutorData();
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [items, setItems] = useState<SuggestionRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      setItems(newestFirst(await gateway.listSuggestions(email)));
      setStatus("ready");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Não foi possível consultar as sugestões.";
      console.error("[Sugestões] Falha ao listar:", err);
      setError(message);
      setStatus("error");
    }
  }, [gateway, email]);

  useEffect(() => {
    if (active) void load();
  }, [active, load]);

  return { status, items, error, reload: load };
}
