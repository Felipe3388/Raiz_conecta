import { describe, expect, it } from "vitest";
import { formatDate, timeAgo } from "./time";

const now = new Date("2026-10-27T12:00:00Z");
const ago = (seconds: number) => new Date(now.getTime() - seconds * 1000);

describe("timeAgo", () => {
  it("conta em segundos, minutos, horas e dias", () => {
    expect(timeAgo(ago(2), now)).toBe("agora");
    expect(timeAgo(ago(30), now)).toBe("há 30 s");
    expect(timeAgo(ago(5 * 60 + 10), now)).toBe("há 5 min");
    expect(timeAgo(ago(3 * 3600), now)).toBe("há 3 h");
    expect(timeAgo(ago(3 * 86400), now)).toBe("há 3 d");
  });
  it("sem data ou data inválida: nunca", () => {
    expect(timeAgo(null, now)).toBe("nunca");
    expect(timeAgo(undefined, now)).toBe("nunca");
    expect(timeAgo("lixo", now)).toBe("nunca");
  });
});

describe("formatDate", () => {
  it("usa o fuso de Brasília e o formato do Brasil", () => {
    expect(formatDate("2026-10-27T01:00:00Z")).toBe("26/10/2026");
    expect(formatDate("2026-10-27T15:00:00Z")).toBe("27/10/2026");
    expect(formatDate(null)).toBe("—");
    expect(formatDate("x")).toBe("—");
  });
});
