import { useCallback, useRef, useState } from "react";
import { useToast } from "./useToast";

// Refresh is scoped to the active screen; requests cannot overlap. Errors leave existing content visible.
export function usePullToRefresh(refresh: () => Promise<void>) {
  const [refreshing, setRefreshing] = useState(false);
  const running = useRef(false);
  const toast = useToast();

  const onRefresh = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    setRefreshing(true);
    try {
      await refresh();
    } catch (error) {
      toast.show("error", error instanceof Error ? error.message : "Não foi possível atualizar. Tente novamente.");
    } finally {
      running.current = false;
      setRefreshing(false);
    }
  }, [refresh, toast]);

  return { refreshing, onRefresh };
}
