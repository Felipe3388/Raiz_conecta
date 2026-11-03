import { NARRATION_DELAY_MS, planNarration, STEP_TRANSITION_MS, type NarrationInput } from "./narration";
import { STEP_IN_MS, STEP_OUT_MS } from "@/components/motion/timing";

const base: NarrationInput = { enabled: true, celebrating: false, between: false, phase: "weigh", hasItem: true };

describe("planNarration", () => {
  it("fala o produto da vez, mas só depois da troca de passo terminar", () => {
    const plan = planNarration(base);
    expect(plan).toEqual({ kind: "weigh", delayMs: NARRATION_DELAY_MS });
    expect(NARRATION_DELAY_MS).toBeGreaterThan(STEP_OUT_MS + STEP_IN_MS);
    expect(STEP_TRANSITION_MS).toBe(STEP_OUT_MS + STEP_IN_MS);
  });

  it("fica em silêncio enquanto a confirmação verde está na tela", () => {
    expect(planNarration({ ...base, celebrating: true })).toBeNull();
    expect(planNarration({ ...base, celebrating: true, between: true })).toBeNull();
  });

  it("avisa o próximo pedido na pausa, também depois da confirmação e da troca", () => {
    expect(planNarration({ ...base, between: true, phase: "weigh" })).toEqual({
      kind: "between",
      delayMs: NARRATION_DELAY_MS,
    });
  });

  it("não fala com a voz desligada, na conferência do pedido ou sem produto", () => {
    expect(planNarration({ ...base, enabled: false })).toBeNull();
    expect(planNarration({ ...base, phase: "confirm" })).toBeNull();
    expect(planNarration({ ...base, phase: undefined })).toBeNull();
    expect(planNarration({ ...base, hasItem: false })).toBeNull();
  });
});
