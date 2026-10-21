// A tela inicial do Produtor. Ela não é uma das abas: abre pelo botão redondo no meio da barra.
export const HOME_ROUTE = "painel";

// As rotas que viram botão na barra. O Expo Router cria uma aba para qualquer arquivo em `(tabs)`; se sobrar uma tela
// antiga (ao extrair uma versão nova por cima da pasta velha), ela não vira botão na barra.
export const PRODUCER_TABS = ["catalogo", "ofertas", "painel", "entregas", "mais"];

export function visibleTabs(routeNames: string[]): string[] {
  return routeNames.filter((name) => PRODUCER_TABS.includes(name));
}

export interface TabSplit {
  // As abas à esquerda e à direita do botão do meio, na ordem em que foram declaradas.
  left: string[];
  right: string[];
  // O botão do meio, se a rota inicial existir.
  home: string | null;
}

// Divide as rotas da barra: o botão Início fica no meio, com as abas repartidas dos dois lados. Sobrando uma, ela vai
// para a direita. Com as quatro abas do Produtor: Catálogo e Ofertas à esquerda; Entregas e Mais à direita.
export function splitTabs(routeNames: string[], homeRoute: string = HOME_ROUTE): TabSplit {
  const tabs = routeNames.filter((name) => name !== homeRoute);
  const half = Math.floor(tabs.length / 2);
  return {
    left: tabs.slice(0, half),
    right: tabs.slice(half),
    home: routeNames.includes(homeRoute) ? homeRoute : null,
  };
}

// Nome da aba para leitor de tela, com o número do selo por extenso: "Ofertas, 1 pedido para responder".
export function badgeLabel(title: string, count: number, one: string, many: string): string {
  if (count <= 0) return title;
  return `${title}, ${count} ${count === 1 ? one : many}`;
}
