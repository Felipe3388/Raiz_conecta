import type { ScaleConnection, ScaleGateway, ScaleReading, ScaleSimulator } from "./ScaleGateway";

interface MockScaleOptions {
  // De quanto em quanto tempo chega uma leitura.
  intervalMs?: number;
  now?: () => number;
}

// Depois de mudar o peso, a leitura balança por este número de leituras e então para no valor certo.
const SETTLE_TICKS = 8;
// Quanto da oscilação sobra a cada leitura, e a velocidade dela (uma onda que vai se apagando).
const DAMPING = 0.55;
const WAVE_SPEED = 1.3;
// O visor mostra de 10 em 10 gramas.
const RESOLUTION_KG = 0.01;

const quantize = (kg: number) => Math.round(kg / RESOLUTION_KG) * RESOLUTION_KG;

// Balança simulada: o que se "coloca" nela (simulator.place) faz a leitura oscilar, como uma balança de verdade,
// e depois assentar no peso. Só trabalha enquanto alguém está ouvindo.
export class MockScaleService implements ScaleGateway {
  readonly simulator: ScaleSimulator;
  private readonly listeners = new Set<(reading: ScaleReading) => void>();
  private readonly intervalMs: number;
  private readonly now: () => number;
  private timer: ReturnType<typeof setInterval> | null = null;
  // De onde a leitura partiu, para onde vai e há quantas leituras mudou.
  private from = 0;
  private to = 0;
  private ticks = SETTLE_TICKS;
  private shown = 0;

  constructor({ intervalMs = 150, now = Date.now }: MockScaleOptions = {}) {
    this.intervalMs = intervalMs;
    this.now = now;
    this.simulator = {
      place: (kg) => this.moveTo(Number.isFinite(kg) && kg > 0 ? kg : 0),
      clear: () => this.moveTo(0),
    };
  }

  subscribe(onReading: (reading: ScaleReading) => void, onConnection?: (connection: ScaleConnection) => void) {
    this.listeners.add(onReading);
    onConnection?.("connected");
    this.start();

    return () => {
      this.listeners.delete(onReading);
      if (this.listeners.size === 0) this.stop();
    };
  }

  private moveTo(kg: number) {
    this.from = this.shown;
    this.to = kg;
    this.ticks = 0;
  }

  private start() {
    if (this.timer) return;
    this.timer = setInterval(() => this.tick(), this.intervalMs);
  }

  private stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  private tick() {
    const settling = this.ticks < SETTLE_TICKS;
    const wave = settling ? (this.from - this.to) * DAMPING ** this.ticks * Math.cos(WAVE_SPEED * this.ticks) : 0;
    this.shown = Math.max(0, quantize(this.to + wave));
    this.ticks += 1;

    const reading: ScaleReading = { kg: this.shown, at: this.now() };
    for (const listener of this.listeners) listener(reading);
  }
}
