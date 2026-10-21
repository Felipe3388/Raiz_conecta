import Constants from "expo-constants";
import { useSettings } from "./useSettings";

export type LegalDocumentId = "terms" | "privacy";

// Controller das Configurações: acessibilidade e o modo de pesagem.
export function useSettingsScreen() {
  const { settings, update } = useSettings();

  return {
    reduceMotion: settings.reduceMotion,
    setReduceMotion: (reduceMotion: boolean) => void update({ reduceMotion }),
    autoWeigh: settings.autoWeigh,
    setAutoWeigh: (autoWeigh: boolean) => void update({ autoWeigh }),
    voice: settings.voice,
    setVoice: (voice: boolean) => void update({ voice }),
    version: Constants.expoConfig?.version ?? "1.0.0",
  };
}
