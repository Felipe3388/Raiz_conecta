import { useRouter } from "expo-router";
import { useState } from "react";
import type { MoreActionId } from "@/content/moreMenu";
import { scaleRowDescription } from "@/content/scaleTexts";
import { useAssistant } from "./useAssistant";
import { useContactSupport } from "./useContactSupport";
import { useProducerIdentity } from "./useProducerIdentity";
import type { LegalDocumentId } from "./useSettingsScreen";
import { useScaleLink } from "./useScaleLink";
import { useSignOutConfirm } from "./useSignOutConfirm";

// Controller da aba Mais: leva às telas, abre os documentos e mostra se a balança está conectada.
export function useMoreScreen() {
  const router = useRouter();
  const assistant = useAssistant();
  const identity = useProducerIdentity();
  const scale = useScaleLink();
  const signOut = useSignOutConfirm();
  const contactSupport = useContactSupport();
  const [openDocument, setOpenDocument] = useState<LegalDocumentId | null>(null);

  // Strategy por tabela: cada linha do menu sabe o que fazer.
  const actions: Record<MoreActionId, () => void> = {
    profile: () => router.push("/perfil"),
    scale: () => router.push("/balanca"),
    settings: () => router.push("/configuracoes"),
    terms: () => setOpenDocument("terms"),
    privacy: () => setOpenDocument("privacy"),
    help: () => assistant.open("help"),
    support: contactSupport,
    signOut: signOut.request,
  };

  return {
    identity,
    // Só avisa "conecte" depois de saber que não há balança (não pisca enquanto carrega).
    needsScale: scale.status === "ready" && scale.scales.length === 0,
    scaleDescription: scaleRowDescription(scale.activeName, scale.scales.length),
    openDocument,
    closeDocument: () => setOpenDocument(null),
    run: (id: MoreActionId) => actions[id](),
    goToScale: actions.scale,
    signOut,
  };
}
