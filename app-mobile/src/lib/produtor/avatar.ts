const LETTER = /[A-Za-zÀ-ÿ]/;

// Iniciais para o círculo do perfil: "Sítio Boa Esperança" vira "SB".
export function initialsOf(name: string): string {
  const letters = name
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0))
    .filter((char) => LETTER.test(char))
    .slice(0, 2);
  return letters.length > 0 ? letters.join("").toUpperCase() : "P";
}

// Ícones que o produtor pode escolher no lugar das iniciais.
export const AVATAR_EMOJIS = [
  { emoji: "🌱", label: "Broto" },
  { emoji: "🍅", label: "Tomate" },
  { emoji: "🥕", label: "Cenoura" },
  { emoji: "🌽", label: "Milho" },
  { emoji: "🍎", label: "Maçã" },
  { emoji: "🍇", label: "Uva" },
  { emoji: "🌻", label: "Girassol" },
  { emoji: "🚜", label: "Trator" },
  { emoji: "🐄", label: "Vaca" },
  { emoji: "🐓", label: "Galinha" },
] as const;
