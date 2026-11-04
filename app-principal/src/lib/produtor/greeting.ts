// "Bom dia", "Boa tarde" ou "Boa noite" pela hora do aparelho (das 5h às 12h, das 12h às 18h, o resto).
export function greetingFor(hour: number): string {
  if (hour >= 5 && hour < 12) return "Bom dia";
  if (hour >= 12 && hour < 18) return "Boa tarde";
  return "Boa noite";
}

// A inicial que aparece no círculo do produtor (o nome fantasia, ou "P").
export function initialOf(name: string | null | undefined): string {
  return (name ?? "").trim().charAt(0).toUpperCase() || "P";
}
