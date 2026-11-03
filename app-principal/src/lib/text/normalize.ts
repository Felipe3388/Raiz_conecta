// Compara textos sem se importar com acento, maiúscula ou espaço sobrando: "Maçã " e "maca" são o mesmo produto.
export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}
