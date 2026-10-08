import type { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";

export type ScreenId = "mural" | "catalogo" | "ofertas" | "painel" | "perfil" | "configuracoes";

const TAB_SCREENS: ScreenId[] = ["mural", "catalogo", "ofertas", "painel"];
const KNOWN_SCREENS: ScreenId[] = [...TAB_SCREENS, "perfil", "configuracoes"];

// Rota do Expo Router (ex.: "/catalogo") -> tela. O que não for conhecido cai no Mural.
export function screenFromPath(pathname: string): ScreenId {
  const first = pathname.split("/").filter(Boolean)[0];
  return KNOWN_SCREENS.find((screen) => screen === first) ?? "mural";
}

// Só as quatro abas têm barra inferior; as outras telas são abertas por cima.
export function hasTabBar(screen: ScreenId): boolean {
  return TAB_SCREENS.includes(screen);
}

export type FabActionId = "help" | "suggest" | "mySuggestions" | "goCatalog" | "goMural";

export interface FabAction {
  id: FabActionId;
  label: string;
  icon: ComponentProps<typeof Ionicons>["name"];
}

const ACTIONS: Record<FabActionId, FabAction> = {
  help: { id: "help", label: "Ajuda", icon: "chatbubble-ellipses-outline" },
  suggest: { id: "suggest", label: "Sugerir produto", icon: "add-circle-outline" },
  mySuggestions: { id: "mySuggestions", label: "Minhas sugestões", icon: "list-outline" },
  goCatalog: { id: "goCatalog", label: "Ajustar meu catálogo", icon: "leaf-outline" },
  goMural: { id: "goMural", label: "Ver pedidos do Mural", icon: "grid-outline" },
};

// O que o botão oferece em cada tela. A Ajuda fica por último, perto do botão principal.
const ACTIONS_BY_SCREEN: Record<ScreenId, FabActionId[]> = {
  mural: ["goCatalog", "help"],
  catalogo: ["suggest", "mySuggestions", "help"],
  ofertas: ["goMural", "help"],
  painel: ["goMural", "help"],
  perfil: ["help"],
  configuracoes: ["help"],
};

export function fabActionsFor(screen: ScreenId): FabAction[] {
  return ACTIONS_BY_SCREEN[screen].map((id) => ACTIONS[id]);
}
