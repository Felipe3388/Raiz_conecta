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

export function productVisual(product: CatalogProduct): ProductVisual {
  const uri = product.imagemUrl?.trim();
  if (uri) return { kind: "image", uri };

  const name = normalizeText(product.nome);
  const match = EMOJI_BY_NAME.find(([keyword]) => name.includes(keyword));
  return { kind: "emoji", emoji: match ? match[1] : FALLBACK_EMOJI };
}
