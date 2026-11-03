import { afterEach, describe, expect, it, vi } from "vitest";
import { clientIp, fail, prismaCode, readJson, serverError, text } from "./http";

describe("fail", () => {
  it("responde { error } com o status", async () => {
    const response = fail(422, "Prazo vencido", { prazoExpirado: true });
    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({ error: "Prazo vencido", prazoExpirado: true });
  });
});

describe("readJson", () => {
  const request = (body: string) => new Request("http://x", { method: "POST", body });
  it("lê objetos", async () => {
    expect(await readJson(request('{"a":1}'))).toEqual({ a: 1 });
  });
  it("devolve null para corpo vazio, quebrado, lista ou texto", async () => {
    expect(await readJson(request(""))).toBeNull();
    expect(await readJson(request("{"))).toBeNull();
    expect(await readJson(request("[1]"))).toBeNull();
    expect(await readJson(request('"oi"'))).toBeNull();
  });
});

describe("serverError", () => {
  afterEach(() => vi.restoreAllMocks());
  it("loga uma linha JSON com o evento e não vaza o erro na resposta", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const response = serverError("oferta.falhou", Object.assign(new Error("conexão caiu"), { code: "P1001" }));
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Erro interno no servidor." });
    expect(JSON.parse(log.mock.calls[0][0] as string)).toMatchObject({ event: "oferta.falhou", message: "conexão caiu", code: "P1001" });
  });
});

describe("prismaCode / text / clientIp", () => {
  it("só reconhece códigos do Prisma", () => {
    expect(prismaCode({ code: "P2002" })).toBe("P2002");
    expect(prismaCode({ code: "ECONNRESET" })).toBeUndefined();
    expect(prismaCode(null)).toBeUndefined();
  });
  it("text só aceita string e apara", () => {
    expect(text("  oi ")).toBe("oi");
    expect(text(5)).toBe("");
    expect(text(undefined)).toBe("");
  });
  it("clientIp usa o primeiro IP encaminhado", () => {
    expect(clientIp(new Request("http://x", { headers: { "x-forwarded-for": "1.2.3.4, 10.0.0.1" } }))).toBe("1.2.3.4");
    expect(clientIp(new Request("http://x"))).toBe("desconhecido");
  });
});
