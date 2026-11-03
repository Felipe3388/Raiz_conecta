import { describe, expect, it } from "vitest";
import { corsHeaders } from "./cors";

describe("corsHeaders", () => {
  it("sem configuração libera qualquer origem", () => {
    expect(corsHeaders(undefined)["Access-Control-Allow-Origin"]).toBe("*");
    expect(corsHeaders("  ")["Access-Control-Allow-Origin"]).toBe("*");
  });
  it("com CORS_ALLOWED_ORIGIN aceita só essa", () => {
    expect(corsHeaders("http://localhost:8081")["Access-Control-Allow-Origin"]).toBe("http://localhost:8081");
  });
  it("libera todos os métodos que a API usa (inclusive PUT e DELETE das balanças)", () => {
    const methods = corsHeaders(undefined)["Access-Control-Allow-Methods"];
    for (const method of ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]) expect(methods).toContain(method);
  });
});
