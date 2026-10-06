import { staggerDelay } from "./timing";

describe("staggerDelay", () => {
  it("cresce de 70 ms em 70 ms", () => {
    expect([0, 1, 2, 3].map(staggerDelay)).toEqual([0, 70, 140, 210]);
  });

  it("para de crescer depois do 8º item, para a tela não demorar a aparecer", () => {
    expect(staggerDelay(8)).toBe(560);
    expect(staggerDelay(20)).toBe(560);
  });
});
