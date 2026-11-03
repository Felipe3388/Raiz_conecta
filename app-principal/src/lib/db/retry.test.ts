import { describe, expect, it, vi } from "vitest";
import { withSerializableRetry } from "./retry";

const conflict = () => Object.assign(new Error("conflito"), { code: "P2034" });

describe("withSerializableRetry", () => {
  it("devolve o resultado de primeira", async () => {
    await expect(withSerializableRetry(async () => 7)).resolves.toBe(7);
  });
  it("tenta de novo quando duas transações disputam (P2034)", async () => {
    const run = vi.fn().mockRejectedValueOnce(conflict()).mockResolvedValueOnce("ok");
    await expect(withSerializableRetry(run)).resolves.toBe("ok");
    expect(run).toHaveBeenCalledTimes(2);
  });
  it("desiste depois do limite de tentativas", async () => {
    const run = vi.fn().mockRejectedValue(conflict());
    await expect(withSerializableRetry(run, 3)).rejects.toMatchObject({ code: "P2034" });
    expect(run).toHaveBeenCalledTimes(3);
  });
  it("não repete outros erros", async () => {
    const run = vi.fn().mockRejectedValue(new Error("falhou"));
    await expect(withSerializableRetry(run)).rejects.toThrow("falhou");
    expect(run).toHaveBeenCalledTimes(1);
  });
});
