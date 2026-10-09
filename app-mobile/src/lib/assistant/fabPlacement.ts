export type FabSide = "left" | "right";

// Onde o botão de ajuda fica: grudado numa lateral e a uma altura, de 0 (no alto) a 1 (embaixo).
// A altura é uma proporção para valer em qualquer tela e tamanho de janela.
export interface FabPlacement {
  side: FabSide;
  y: number;
}

export const DEFAULT_PLACEMENT: FabPlacement = { side: "right", y: 1 };

// Medidas da tela, em pixels. `top` e `bottom` são as folgas onde o botão não deve entrar (barra de cima, abas).
export interface FabLayout {
  width: number;
  height: number;
  size: number;
  // Distância da lateral quando o botão está à mostra.
  edge: number;
  // Quanto do botão aparece quando está escondido.
  peek: number;
  top: number;
  bottom: number;
}

export interface Point {
  x: number;
  y: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

// Faixa em que o topo do botão pode ficar.
function verticalRange(layout: FabLayout): { min: number; max: number } {
  const min = layout.top;
  return { min, max: Math.max(min, layout.height - layout.bottom - layout.size) };
}

// Canto de cima, à esquerda, do botão parado. Escondido, ele sai da tela e sobra só uma abinha.
export function restPoint(placement: FabPlacement, layout: FabLayout, tucked: boolean): Point {
  const { min, max } = verticalRange(layout);
  const y = min + clamp(placement.y, 0, 1) * (max - min);
  const left = tucked ? -(layout.size - layout.peek) : layout.edge;
  const right = tucked ? layout.width - layout.peek : layout.width - layout.edge - layout.size;
  return { x: placement.side === "left" ? left : right, y };
}

// Onde o botão está enquanto é arrastado: o ponto onde ele começou, mais o que o dedo já andou antes de o arrastar
// "pegar" (`grabbed`) e o que andou depois (`moved`). Fica dentro da tela; nas laterais pode sair até sobrar a abinha.
export function dragPoint(start: Point, grabbed: Point, moved: Point, layout: FabLayout): Point {
  const { min, max } = verticalRange(layout);
  return {
    x: clamp(start.x + grabbed.x + moved.x, -(layout.size - layout.peek), layout.width - layout.peek),
    y: clamp(start.y + grabbed.y + moved.y, min, max),
  };
}

// Para onde o botão vai ao ser solto em `point` (canto de cima, à esquerda): gruda na lateral mais perto.
export function snapPlacement(point: Point, layout: FabLayout): FabPlacement {
  const { min, max } = verticalRange(layout);
  const centerX = point.x + layout.size / 2;
  const y = max === min ? 1 : clamp((point.y - min) / (max - min), 0, 1);
  return { side: centerX < layout.width / 2 ? "left" : "right", y };
}

// Alternativa ao arrastar, para quem não consegue: troca de lado e mantém a altura.
export function flipSide(placement: FabPlacement): FabPlacement {
  return { ...placement, side: placement.side === "left" ? "right" : "left" };
}

// Quanto o botão sobe para não ficar sobre uma barra fixa de `lift` px no fim da tela.
// Só sobe se estiver perto do fundo; lá em cima a barra não atrapalha.
export function liftShift(top: number, layout: FabLayout, lift: number): number {
  if (lift <= 0) return 0;
  const lowestTop = layout.height - layout.bottom - lift - layout.size;
  return Math.max(0, top - lowestTop);
}

// As opções abrem para cima, a não ser que caibam melhor embaixo.
export function menuDirection(layout: FabLayout, top: number, itemCount: number, itemHeight: number): "up" | "down" {
  const needed = itemCount * itemHeight;
  const above = top - layout.top;
  const below = layout.height - layout.bottom - (top + layout.size);
  return above >= needed || above >= below ? "up" : "down";
}

// Lê o que foi salvo; qualquer dúvida volta ao padrão.
export function parsePlacement(value: unknown): FabPlacement {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return DEFAULT_PLACEMENT;
  const { side, y } = value as Record<string, unknown>;
  if ((side !== "left" && side !== "right") || typeof y !== "number" || !Number.isFinite(y)) return DEFAULT_PLACEMENT;
  return { side, y: clamp(y, 0, 1) };
}
