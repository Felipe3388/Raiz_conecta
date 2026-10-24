import { roundKg } from "./weight";

// Abaixo disto a balança é considerada vazia (a leitura nunca é exatamente zero).
export const EMPTY_KG = 0.05;
// Quantas leituras seguidas são olhadas para decidir se o peso parou.
export const STABLE_SAMPLES = 5;
// Quanto as leituras podem diferir entre si: 20 g, ou 0,2% do peso (o que for maior), pois balanças grandes oscilam mais.
const SPREAD_ABSOLUTE_KG = 0.02;
const SPREAD_RELATIVE = 0.002;

export function isEmptyScale(kg: number): boolean {
  return kg < EMPTY_KG;
}

// A balança manda leituras várias vezes por segundo, e elas oscilam até o peso assentar. Esta regra decide quando
// o peso pode ser registrado: as últimas leituras precisam estar juntas. Devolve o valor do meio delas (a mediana, que é
// o que o visor da balança mostra e ignora uma leitura fora do normal), ou null se ainda oscila (ou se a balança está
// vazia). É a mesma regra para a balança simulada e para a de verdade.
export function stableReading(samples: number[]): number | null {
  if (samples.length < STABLE_SAMPLES) return null;

  const recent = samples.slice(-STABLE_SAMPLES);
  const average = recent.reduce((sum, value) => sum + value, 0) / recent.length;
  if (isEmptyScale(average)) return null;

  const { spreadKg, allowedKg } = readingSpread(samples);
  const median = [...recent].sort((a, b) => a - b)[Math.floor(recent.length / 2)];
  return spreadKg <= allowedKg ? roundKg(median) : null;
}

export interface ReadingSpread {
  // Quanto as últimas leituras diferem entre si e quanto a regra aceita (20 g ou 0,2% do peso, o que for maior).
  spreadKg: number;
  allowedKg: number;
}

// A variação das últimas leituras, para dizer à pessoa o quanto o peso está oscilando ("carga irregular"). Em gramas,
// para 9,89 - 9,87 não virar 0,02000000000000002 e passar do limite por um resto de decimal.
export function readingSpread(samples: number[]): ReadingSpread {
  if (samples.length < STABLE_SAMPLES) return { spreadKg: 0, allowedKg: SPREAD_ABSOLUTE_KG };

  const recent = samples.slice(-STABLE_SAMPLES);
  const average = recent.reduce((sum, value) => sum + value, 0) / recent.length;
  return {
    spreadKg: roundKg(Math.max(...recent) - Math.min(...recent)),
    allowedKg: roundKg(Math.max(SPREAD_ABSOLUTE_KG, average * SPREAD_RELATIVE)),
  };
}

// Depois que o peso fica estável, ele precisa continuar parado por 5 segundos antes de o app aceitar (e, no modo
// rápido, registrar sozinho). Se voltar a oscilar, a contagem recomeça.
export const STABLE_HOLD_SECONDS = 5;

// Um segundo se passou: quanto falta para o peso "ficar firme". `stable` é se o peso está parado agora.
export function holdTick(secondsLeft: number, stable: boolean): number {
  return stable ? Math.max(secondsLeft - 1, 0) : STABLE_HOLD_SECONDS;
}

// Depois de registrar um peso, o botão fica travado até a balança esvaziar: o mesmo lote não pode ser contado duas vezes,
// e o produtor só consegue registrar o próximo lote tirando o anterior da balança.
export function keepLocked(locked: boolean, kg: number): boolean {
  return locked && !isEmptyScale(kg);
}

export type ScaleStatusKey = "connecting" | "lost" | "empty" | "settling" | "stable" | "locked";

interface ScaleStatusInput {
  connection: "connecting" | "connected" | "lost";
  // Leitura mais recente e o peso assentado (null enquanto oscila).
  kg: number;
  stableKg: number | null;
  // Já registrou este lote e a balança ainda não esvaziou.
  locked: boolean;
}

// Em que pé está a balança, para a tela dizer o que a pessoa deve fazer agora. O texto de cada situação está em
// content/deliveryTexts.ts.
export function scaleStatus({ connection, kg, stableKg, locked }: ScaleStatusInput): ScaleStatusKey {
  if (connection !== "connected") return connection;
  if (isEmptyScale(kg)) return "empty";
  if (locked) return "locked";
  return stableKg === null ? "settling" : "stable";
}
