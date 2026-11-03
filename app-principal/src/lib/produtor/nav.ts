// As telas do Produtor no site, na mesma ordem e com os mesmos nomes das abas do app mobile
// (Catálogo, Ofertas, Início, Entregas, Mais). `home` é o botão do meio da barra de baixo.
export interface ProducerNavItem {
  id: "inicio" | "catalogo" | "ofertas" | "entregas" | "mais";
  label: string;
  href: string;
  home?: boolean;
}

export const PRODUCER_NAV: ProducerNavItem[] = [
  { id: "catalogo", label: "Catálogo", href: "/produtor/catalogo" },
  { id: "ofertas", label: "Ofertas", href: "/produtor/ofertas" },
  { id: "inicio", label: "Início", href: "/produtor", home: true },
  { id: "entregas", label: "Entregas", href: "/produtor/entregas" },
  { id: "mais", label: "Mais", href: "/produtor/mais" },
];

// Telas que se abrem a partir do Mais (como no app): enquanto estão abertas, o Mais fica marcado.
export const MORE_SCREENS = ["/produtor/perfil", "/produtor/balancas"] as const;

// Qual item está aberto, pelo caminho da página. `/produtor` só vale quando é exatamente ele.
export function activeNavId(pathname: string): ProducerNavItem["id"] | null {
  const clean = pathname.replace(/\/+$/, "") || "/";
  const match = PRODUCER_NAV.filter((item) => !item.home).find(
    (item) => clean === item.href || clean.startsWith(`${item.href}/`),
  );
  if (match) return match.id;
  if (MORE_SCREENS.some((href) => clean === href || clean.startsWith(`${href}/`))) return "mais";
  return clean === "/produtor" ? "inicio" : null;
}

// "1 pedido para responder" / "3 pedidos para responder": o texto lido por leitor de tela quando a aba tem número.
export function badgeLabel(label: string, count: number, one: string, many: string): string {
  if (count <= 0) return label;
  return `${label}, ${count} ${count === 1 ? one : many}`;
}
