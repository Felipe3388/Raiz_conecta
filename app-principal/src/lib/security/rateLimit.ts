// Limite de tentativas erradas (senha) por chave, em memória. No Vercel cada instância tem a sua contagem, então isto
// não é uma barreira completa: só freia quem tenta adivinhar senha em sequência. Para um limite global use um
// armazenamento compartilhado (Redis/Upstash) trocando só esta classe.
interface Options {
  max: number;
  windowMs: number;
  now?: () => number;
}

export class FailureLimiter {
  private readonly attempts = new Map<string, number[]>();
  private readonly max: number;
  private readonly windowMs: number;
  private readonly now: () => number;

  constructor({ max, windowMs, now = Date.now }: Options) {
    this.max = max;
    this.windowMs = windowMs;
    this.now = now;
  }

  private recent(key: string): number[] {
    const limit = this.now() - this.windowMs;
    const kept = (this.attempts.get(key) ?? []).filter((time) => time > limit);
    if (kept.length > 0) this.attempts.set(key, kept);
    else this.attempts.delete(key);
    return kept;
  }

  // Segundos até poder tentar de novo; 0 se pode tentar agora.
  retryAfterSeconds(key: string): number {
    const recent = this.recent(key);
    if (recent.length < this.max) return 0;
    return Math.max(1, Math.ceil((recent[0] + this.windowMs - this.now()) / 1000));
  }

  fail(key: string): void {
    const recent = this.recent(key);
    recent.push(this.now());
    this.attempts.set(key, recent);
    // Evita crescer sem limite se alguém varre milhares de e-mails.
    if (this.attempts.size > 5_000) this.attempts.delete(this.attempts.keys().next().value as string);
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }
}
