import type { IconName } from "@/types/icon";

export type ScreenId = "catalogo" | "ofertas" | "entregas" | "painel" | "mais" | "perfil" | "configuracoes" | "balanca";

const TAB_SCREENS: ScreenId[] = ["catalogo", "ofertas", "entregas", "painel", "mais"];
// Primeiro pedaço da rota (ex.: "catalogo") -> tela. A maioria tem o mesmo nome; o resto está listado aqui.
const SCREEN_BY_SEGMENT: Record<string, ScreenId> = Object.fromEntries(
  [...TAB_SCREENS, "perfil", "configuracoes", "balanca"].map((screen) => [screen, screen as ScreenId]),
);

// Rota do Expo Router (ex.: "/catalogo") -> tela. O que não for conhecido cai em Ofertas.
export function screenFromPath(pathname: string): ScreenId {
  const first = pathname.split("/").filter(Boolean)[0];
  return (first !== undefined && SCREEN_BY_SEGMENT[first]) || "ofertas";
}

// Só as telas da barra inferior (as quatro abas e o Painel, no botão Início) a mostram; as outras abrem por cima.
export function hasTabBar(screen: ScreenId): boolean {
  return TAB_SCREENS.includes(screen);
}

export type FabActionId = "help" | "suggest" | "mySuggestions" | "goCatalog" | "goOffers" | "undo";

export interface FabAction {
  id: FabActionId;
  label: string;
  icon: IconName;
}

const ACTIONS: Record<FabActionId, FabAction> = {
  help: { id: "help", label: "Ajuda", icon: "chatbubble-ellipses-outline" },
  suggest: { id: "suggest", label: "Sugerir produto", icon: "add-circle-outline" },
  mySuggestions: { id: "mySuggestions", label: "Minhas sugestões", icon: "list-outline" },
  goCatalog: { id: "goCatalog", label: "Ajustar meu catálogo", icon: "nutrition-outline" },
  goOffers: { id: "goOffers", label: "Ver minhas ofertas", icon: "pricetags-outline" },
  undo: { id: "undo", label: "Desfazer ação recente", icon: "arrow-undo-outline" },
};

// O que o botão oferece em cada tela. A Ajuda fica por último, perto do botão principal.
const ACTIONS_BY_SCREEN: Record<ScreenId, FabActionId[]> = {
  catalogo: ["suggest", "mySuggestions", "help"],
  ofertas: ["goCatalog", "help"],
  entregas: ["goOffers", "help"],
  painel: ["goOffers", "help"],
  mais: ["help"],
  perfil: ["help"],
  configuracoes: ["help"],
  balanca: ["help"],
};

// `canUndo`: há uma ação recente que ainda dá para desfazer. A opção aparece em qualquer tela, antes da Ajuda.
export function fabActionsFor(screen: ScreenId, canUndo = false): FabAction[] {
  const ids = ACTIONS_BY_SCREEN[screen];
  const withUndo = canUndo ? [...ids.slice(0, -1), "undo" as const, ...ids.slice(-1)] : ids;
  return withUndo.map((id) => ACTIONS[id]);
}
