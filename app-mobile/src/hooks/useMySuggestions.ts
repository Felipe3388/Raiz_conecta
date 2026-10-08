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

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      setItems(newestFirst(await gateway.listSuggestions(email)));
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, [gateway, email]);

  useEffect(() => {
    if (active) void load();
  }, [active, load]);

  return { status, items, reload: load };
}
