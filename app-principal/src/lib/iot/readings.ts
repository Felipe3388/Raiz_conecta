// Leituras que o módulo envia: validação e arrumação. Funções puras.

export const MAX_READINGS_PER_REQUEST = 50;
// A célula de carga da balança aguenta até este peso; acima disso a leitura é erro do módulo.
export const MAX_KG = 500;
// Relógio do módulo não é confiável (o ESP32 não tem hora própria): se a hora dele estiver muito longe da do servidor,
// vale a do servidor.
const MAX_CLOCK_SKEW_MS = 5 * 60_000;

export interface Reading {
  kg: number;
  estavel: boolean;
  medidoEm: Date;
}

export type ParsedReadings = { ok: true; leituras: Reading[]; firmware: string | null } | { ok: false; error: string };

// Corpo: { firmware?: "1.2.0", leituras: [{ kg: 1.25, estavel?: true, t?: 1730000000000 }] }.
// A lista pode vir vazia: serve de "estou vivo" (batimento).
export function parseReadings(body: unknown, now: Date = new Date()): ParsedReadings {
  if (!body || typeof body !== "object") return { ok: false, error: "Envie um JSON com a lista de leituras." };
  const { leituras, firmware } = body as { leituras?: unknown; firmware?: unknown };
  if (!Array.isArray(leituras)) return { ok: false, error: "O campo leituras deve ser uma lista." };
  if (leituras.length > MAX_READINGS_PER_REQUEST) return { ok: false, error: `Envie no máximo ${MAX_READINGS_PER_REQUEST} leituras por vez.` };

  const parsed: Reading[] = [];
  for (const item of leituras) {
    const { kg, estavel, t } = (item ?? {}) as { kg?: unknown; estavel?: unknown; t?: unknown };
    if (typeof kg !== "number" || !Number.isFinite(kg)) return { ok: false, error: "Cada leitura precisa de kg numérico." };
    if (kg < -0.5 || kg > MAX_KG) return { ok: false, error: `Peso fora do intervalo (0 a ${MAX_KG} kg).` };

    const informed = typeof t === "number" && Number.isFinite(t) ? t : null;
    const medido = informed !== null && Math.abs(informed - now.getTime()) <= MAX_CLOCK_SKEW_MS ? new Date(informed) : now;
    // Ruído da balança vazia (-0,01) vira 0; o peso é guardado em gramas (3 casas).
    parsed.push({ kg: Math.max(0, Math.round(kg * 1000) / 1000), estavel: estavel === true, medidoEm: medido });
  }

  parsed.sort((a, b) => a.medidoEm.getTime() - b.medidoEm.getTime());
  const version = typeof firmware === "string" ? firmware.trim().slice(0, 32) : "";
  return { ok: true, leituras: parsed, firmware: version || null };
}

// A balança está "no ar" se falou com o servidor há pouco.
export const ONLINE_WINDOW_MS = 15_000;

export function isOnline(ultimoContato: Date | string | null | undefined, now: Date = new Date()): boolean {
  if (!ultimoContato) return false;
  return now.getTime() - new Date(ultimoContato).getTime() <= ONLINE_WINDOW_MS;
}

export interface LastReading {
  kg: number | null;
  estavel: boolean;
}

// Só as leituras que viram histórico: peso estável, acima de zero, e diferente do último estável já guardado
// (uma balança parada manda a mesma leitura várias vezes por segundo; guardar todas encheria o banco).
export const MIN_CHANGE_KG = 0.005;

export function readingsToStore(readings: Reading[], previous: LastReading): Reading[] {
  const stored: Reading[] = [];
  let lastStable: number | null = previous.estavel ? previous.kg : null;
  for (const reading of readings) {
    if (reading.estavel && reading.kg > 0 && (lastStable === null || Math.abs(reading.kg - lastStable) >= MIN_CHANGE_KG)) {
      stored.push(reading);
    }
    lastStable = reading.estavel ? reading.kg : null;
  }
  return stored;
}
