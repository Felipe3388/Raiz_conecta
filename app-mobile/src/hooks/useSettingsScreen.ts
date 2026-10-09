import { useRouter } from "expo-router";
import Constants from "expo-constants";
import { useState } from "react";
import { useContactSupport } from "./useContactSupport";
import { useSettings } from "./useSettings";
import { useSignOutConfirm } from "./useSignOutConfirm";

export type LegalDocumentId = "terms" | "privacy";

// Controller das Configurações: acessibilidade, documentos de privacidade e atalhos da conta.
export function useSettingsScreen() {
  const router = useRouter();
  const { settings, update } = useSettings();
  const signOut = useSignOutConfirm();
  const contactSupport = useContactSupport();
  const [openDocument, setOpenDocument] = useState<LegalDocumentId | null>(null);

  return {
    reduceMotion: settings.reduceMotion,
    setReduceMotion: (reduceMotion: boolean) => void update({ reduceMotion }),
    openDocument,
    openTerms: () => setOpenDocument("terms"),
    openPrivacy: () => setOpenDocument("privacy"),
    closeDocument: () => setOpenDocument(null),
    goToProfile: () => router.push("/perfil"),
    openPriceSimulator: () => router.push("/simulador-preco"),
    contactSupport,
    signOut,
    version: Constants.expoConfig?.version ?? "1.0.0",
  };
}
