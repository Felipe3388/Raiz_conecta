import { describe, expect, it } from "vitest";
import { plural } from "./plural";

describe("plural", () => {
  it("usa o singular só para 1", () => {
    expect(plural(0, "conta")).toBe("0 contas");
    expect(plural(1, "conta")).toBe("1 conta");
    expect(plural(3, "conta")).toBe("3 contas");
  });
  it("aceita um plural próprio", () => {
    expect(plural(1, "nova", "novas")).toBe("1 nova");
    expect(plural(2, "nova", "novas")).toBe("2 novas");
  });
});
