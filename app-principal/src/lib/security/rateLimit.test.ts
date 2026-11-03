import { describe, expect, it } from "vitest";
import { FailureLimiter } from "./rateLimit";

describe("FailureLimiter", () => {
  it("libera até o máximo de erros e depois bloqueia com o tempo que falta", () => {
    let now = 0;
    const limiter = new FailureLimiter({ max: 3, windowMs: 60_000, now: () => now });
    for (let i = 0; i < 3; i++) {
      expect(limiter.retryAfterSeconds("a")).toBe(0);
      limiter.fail("a");
      now += 1_000;
    }
    expect(limiter.retryAfterSeconds("a")).toBe(57);
    expect(limiter.retryAfterSeconds("b")).toBe(0);
  });

  it("volta a liberar quando a janela passa", () => {
    let now = 0;
    const limiter = new FailureLimiter({ max: 2, windowMs: 1_000, now: () => now });
    limiter.fail("a");
    limiter.fail("a");
    expect(limiter.retryAfterSeconds("a")).toBeGreaterThan(0);
    now = 1_500;
    expect(limiter.retryAfterSeconds("a")).toBe(0);
  });

  it("zera a contagem depois de um acerto", () => {
    const limiter = new FailureLimiter({ max: 1, windowMs: 60_000 });
    limiter.fail("a");
    expect(limiter.retryAfterSeconds("a")).toBeGreaterThan(0);
    limiter.reset("a");
    expect(limiter.retryAfterSeconds("a")).toBe(0);
  });
});
