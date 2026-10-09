import { normalizeText } from "@/lib/text/normalize";
import type { CatalogProduct } from "@/types/produtor";

export type ProductVisual = { kind: "image"; uri: string } | { kind: "emoji"; emoji: string };

const FALLBACK_EMOJI = "🌱";

// Enquanto o produto não tem foto, um emoji do próprio alimento ocupa o lugar dela.
const EMOJI_BY_NAME: [string, string][] = [
  ["pimentao", "🫑"],
  ["tomate", "🍅"],
  ["alface", "🥬"],
  ["couve", "🥬"],
  ["cenoura", "🥕"],
  ["batata doce", "🍠"],
  ["batata", "🥔"],
  ["cebola", "🧅"],
  ["alho", "🧄"],
  ["banana", "🍌"],
  ["maca", "🍎"],
  ["laranja", "🍊"],
  ["limao", "🍋"],
  ["milho", "🌽"],
  ["abobora", "🎃"],
  ["morango", "🍓"],
  ["brocolis", "🥦"],
  ["abacaxi", "🍍"],
  ["uva", "🍇"],
  ["melancia", "🍉"],
  ["pepino", "🥒"],
  ["berinjela", "🍆"],
  ["manga", "🥭"],
  ["coco", "🥥"],
  ["pera", "🍐"],
  ["pessego", "🍑"],
  ["mandioca", "🌿"],
];

// O emoji do alimento pelo nome; um broto se não houver um parecido.
export function productEmoji(name: string): string {
  const normalized = normalizeText(name);
  const match = EMOJI_BY_NAME.find(([keyword]) => normalized.includes(keyword));
  return match ? match[1] : FALLBACK_EMOJI;
}

export function productVisual(product: CatalogProduct): ProductVisual {
  const uri = product.imagemUrl?.trim();
  if (uri) return { kind: "image", uri };
  return { kind: "emoji", emoji: productEmoji(product.nome) };
}
