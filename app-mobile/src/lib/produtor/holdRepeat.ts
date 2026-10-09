// Segurar o + ou o −: depois de um instante o número passa a andar sozinho, cada vez mais rápido.
export const HOLD_DELAY_MS = 400;

const MIN_INTERVAL_MS = 40;

// Tempo até a próxima repetição (tick 0 é a primeira): começa devagar e acelera.
export function repeatInterval(tick: number): number {
  if (tick < 5) return 180;
  if (tick < 12) return 110;
  if (tick < 25) return 70;
  return MIN_INTERVAL_MS;
}

// Quanto cada repetição soma. Começa de 1 em 1 e, segurando mais, cresce em proporção ao limite,
// para uma quantidade grande (ex.: 500 kg) não levar um minuto para chegar lá.
export function repeatStep(tick: number, max: number): number {
  if (tick < 12) return 1;
  if (tick < 25) return Math.max(1, Math.ceil(max / 150));
  return Math.max(1, Math.ceil(max / 50));
}

export interface HeldValue {
  value: number;
  // Chegou ao fim (zero ou o limite): é hora de parar de repetir.
  done: boolean;
}

// Próximo valor ao segurar: anda `repeatStep` na direção pedida e nunca passa de 0 nem do limite.
export function heldValue(current: number, direction: 1 | -1, tick: number, max: number): HeldValue {
  const upper = Math.max(0, max);
  const value = Math.min(upper, Math.max(0, current + direction * repeatStep(tick, upper)));
  return { value, done: direction === 1 ? value >= upper : value <= 0 };
}
