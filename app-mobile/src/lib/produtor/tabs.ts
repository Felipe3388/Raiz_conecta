// A tela inicial do Produtor. Ela não é uma das abas: abre pelo botão redondo no meio da barra.
export const HOME_ROUTE = "painel";

export interface TabSplit {
  // As abas à esquerda e à direita do botão do meio, na ordem em que foram declaradas.
  left: string[];
  right: string[];
  // O botão do meio, se a rota inicial existir.
  home: string | null;
}

// Divide as rotas da barra: o botão Início fica no meio, com metade das abas de cada lado
// (quatro abas: duas à esquerda e duas à direita).
export function splitTabs(routeNames: string[], homeRoute: string = HOME_ROUTE): TabSplit {
  const tabs = routeNames.filter((name) => name !== homeRoute);
  const half = Math.ceil(tabs.length / 2);
  return {
    left: tabs.slice(0, half),
    right: tabs.slice(half),
    home: routeNames.includes(homeRoute) ? homeRoute : null,
  };
}
