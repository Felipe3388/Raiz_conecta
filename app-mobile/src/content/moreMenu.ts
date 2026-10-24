import type { IconName } from "@/types/icon";

export type MoreActionId = "profile" | "scale" | "settings" | "terms" | "privacy" | "help" | "support" | "signOut";

export interface MoreItem {
  id: MoreActionId;
  label: string;
  description?: string;
  icon: IconName;
  tone?: "danger";
}

export interface MoreSection {
  id: string;
  title: string;
  icon: IconName;
  items: MoreItem[];
}

// A aba Mais, no estilo da aba "Mais" do Mercado Livre: o que não cabe na barra, agrupado por assunto. A linha da
// balança ganha o estado (conectada ou não) na tela. Sair da conta fica sozinho no fim.
export const MORE_SECTIONS: MoreSection[] = [
  {
    id: "account",
    title: "Minha conta",
    icon: "person-circle-outline",
    items: [
      { id: "profile", label: "Meu Perfil", icon: "person-outline" },
      { id: "scale", label: "Minha balança", icon: "scale-outline" },
    ],
  },
  {
    id: "preferences",
    title: "Preferências",
    icon: "options-outline",
    items: [{ id: "settings", label: "Configurações", icon: "settings-outline" }],
  },
  {
    id: "privacy",
    title: "Privacidade",
    icon: "shield-checkmark-outline",
    items: [
      { id: "terms", label: "Termos de Uso", icon: "document-text-outline" },
      { id: "privacy", label: "Política de Privacidade", icon: "lock-closed-outline" },
    ],
  },
  {
    id: "help",
    title: "Ajuda",
    icon: "help-buoy-outline",
    items: [
      { id: "help", label: "Ajuda", icon: "chatbubble-ellipses-outline" },
      { id: "support", label: "Falar com Suporte", icon: "mail-outline" },
    ],
  },
];

export const SIGN_OUT_ITEM: MoreItem = {
  id: "signOut",
  label: "Sair da conta",
  icon: "log-out-outline",
  tone: "danger",
};
