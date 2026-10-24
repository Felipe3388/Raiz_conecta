import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { SCALE_SETTINGS } from "@/content/scaleTexts";
import { useScaleLink } from "./useScaleLink";
import { useSettings } from "./useSettings";
import { useToast } from "./useToast";

export type LegalDocumentId = "terms" | "privacy";

// Controller das Configurações: acessibilidade e o modo de pesagem.
export function useSettingsScreen() {
  const { settings, update } = useSettings();
  const router = useRouter();
  const toast = useToast();
  const scale = useScaleLink();

  // O nome da balança conectada, editável: começa com o nome que aparece hoje e volta a ele quando a conectada muda.
  const connected = scale.link;
  const shownName = scale.activeName ?? "";
  const [name, setName] = useState(shownName);
  useEffect(() => setName(shownName), [shownName, connected?.deviceId]);
  const [isSavingName, setIsSavingName] = useState(false);

  async function saveName() {
    if (!connected) return;
    setIsSavingName(true);
    try {
      await scale.renameScale(connected.deviceId, name);
      toast.show("success", SCALE_SETTINGS.saved);
    } catch (error) {
      toast.show("error", error instanceof Error ? error.message : "Erro de conexão.");
    } finally {
      setIsSavingName(false);
    }
  }

  return {
    reduceMotion: settings.reduceMotion,
    setReduceMotion: (reduceMotion: boolean) => void update({ reduceMotion }),
    autoWeigh: settings.autoWeigh,
    setAutoWeigh: (autoWeigh: boolean) => void update({ autoWeigh }),
    voice: settings.voice,
    setVoice: (voice: boolean) => void update({ voice }),
    scale: {
      isReady: scale.status === "ready",
      isConnected: connected !== null,
      name,
      setName,
      // Só dá para salvar quando o nome mudou.
      canSave: connected !== null && name.trim() !== shownName && !isSavingName,
      isSaving: isSavingName,
      save: saveName,
      manage: () => router.push("/balanca"),
    },
    version: Constants.expoConfig?.version ?? "1.0.0",
  };
}
