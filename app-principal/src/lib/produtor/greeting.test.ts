import { describe, expect, it } from "vitest";
import { greetingFor, initialOf } from "./greeting";

describe("saudação do painel", () => {
  it.each([[5, "Bom dia"], [11, "Bom dia"], [12, "Boa tarde"], [17, "Boa tarde"], [18, "Boa noite"], [2, "Boa noite"]])("%i h → %s", (hour, text) => {
    expect(greetingFor(hour)).toBe(text);
  });

  it("inicial do produtor", () => {
    expect(initialOf(" sítio boa vista")).toBe("S");
    expect(initialOf(null)).toBe("P");
    expect(initialOf("  ")).toBe("P");
  });
});
