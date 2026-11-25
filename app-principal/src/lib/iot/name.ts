// O nome mais longo que o produtor pode dar à balança (o mesmo limite do app).
export const MAX_SCALE_NAME_LENGTH = 30;

// O nome digitado, arrumado: sem espaços sobrando e no máximo 30 letras. Vazio volta ao nome de fábrica (null).
export function cleanScaleName(text: string): string | null {
  const cleaned = text.replace(/\s+/g, " ").trim().slice(0, MAX_SCALE_NAME_LENGTH).trim();
  return cleaned === "" ? null : cleaned;
}

// O nome de fábrica de uma balança nova: "Balança RC-07E1" (final do MAC).
export function factoryName(deviceId: string): string {
  return `Balança RC-${deviceId.replace(/[^0-9a-z]/gi, "").toUpperCase().slice(-4)}`;
}
