import type { IconName } from "@/types/icon";

export type UserMenuItemId = "profile" | "settings" | "help" | "signOut";

export interface UserMenuItem {
  id: UserMenuItemId;
  label: string;
  icon: IconName;
  // "danger" separa a saída das outras opções, para ninguém tocar nela sem querer.
  tone?: "danger";
}

// Opções do menu do usuário, na ordem em que aparecem. O atalho de Acessibilidade entra aqui no futuro.
export const USER_MENU_ITEMS: UserMenuItem[] = [
  { id: "profile", label: "Meu Perfil", icon: "person-outline" },
  { id: "settings", label: "Configurações", icon: "settings-outline" },
  { id: "help", label: "Ajuda", icon: "chatbubble-ellipses-outline" },
  { id: "signOut", label: "Sair da conta", icon: "log-out-outline", tone: "danger" },
];
