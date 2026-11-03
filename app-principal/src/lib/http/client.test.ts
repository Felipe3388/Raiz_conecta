import { describe, expect, it, vi } from "vitest";
import { NETWORK_ERROR, api, messageFor } from "./client";

const reply = (status: number, body?: unknown) =>
  vi.fn().mockResolvedValue(new Response(body === undefined ? null : JSON.stringify(body), { status }));

describe("api", () => {
  it("devolve os dados quando dá certo", async () => {
    const fetcher = reply(200, { nome: "Maria" });
    const result = await api<{ nome: string }>("/api/x", {}, { fetcher, onUnauthorized: vi.fn() });

    expect(result).toEqual({ ok: true, status: 200, data: { nome: "Maria" }, error: "" });
  });

  it("manda JSON com o Content-Type certo e formulário sem forçar nenhum", async () => {
    const fetcher = reply(200, {});
    await api("/api/x", { method: "POST", json: { a: 1 } }, { fetcher, onUnauthorized: vi.fn() });
    expect(fetcher).toHaveBeenLastCalledWith("/api/x", expect.objectContaining({ method: "POST", body: '{"a":1}', headers: { "Content-Type": "application/json" }, credentials: "same-origin" }));

    const form = new FormData();
    await api("/api/x", { method: "PUT", form }, { fetcher, onUnauthorized: vi.fn() });
    const init = fetcher.mock.calls[1][1];
    expect(init.body).toBe(form);
    expect(init.headers).toBeUndefined();
  });

  it("usa a mensagem do servidor quando existe", async () => {
    const result = await api("/api/x", {}, { fetcher: reply(409, { error: "Já existe." }), onUnauthorized: vi.fn() });
    expect(result).toMatchObject({ ok: false, status: 409, error: "Já existe." });
  });

  it("sem internet: status 0 e mensagem clara, sem lançar", async () => {
    const fetcher = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    expect(await api("/api/x", {}, { fetcher, onUnauthorized: vi.fn() })).toEqual({ ok: false, status: 0, data: null, error: NETWORK_ERROR });
  });

  it("resposta que não é JSON não derruba a tela", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response("<html>erro</html>", { status: 502 }));
    const result = await api("/api/x", {}, { fetcher, onUnauthorized: vi.fn() });
    expect(result).toMatchObject({ ok: false, status: 502, data: null });
    expect(result.error).toMatch(/servidor/);
  });

  it("401 avisa a sessão vencida, a não ser que a tela peça o contrário", async () => {
    const onUnauthorized = vi.fn();
    await api("/api/x", {}, { fetcher: reply(401, {}), onUnauthorized });
    expect(onUnauthorized).toHaveBeenCalledOnce();

    await api("/api/auth/me", { redirectOnUnauthorized: false }, { fetcher: reply(401, {}), onUnauthorized });
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });
});

describe("messageFor", () => {
  it("traduz o status quando o servidor não explicou", () => {
    expect(messageFor(403, null)).toMatch(/acesso/);
    expect(messageFor(429, {})).toMatch(/tentativas/);
    expect(messageFor(500, {})).toMatch(/servidor/);
    expect(messageFor(418, { error: "  " })).toMatch(/tente de novo/i);
  });
});
