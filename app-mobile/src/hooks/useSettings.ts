import { useSyncExternalStore } from "react";
import { getSettingsStore } from "@/lib/settings";
import type { Settings } from "@/lib/settings";

// Configurações do app (hoje só "reduzir animações"), sempre atualizadas em qualquer tela.
export function useSettings() {
  const store = getSettingsStore();
  const settings: Settings = useSyncExternalStore(store.subscribe, store.get, store.get);
  return { settings, update: store.update };
}
