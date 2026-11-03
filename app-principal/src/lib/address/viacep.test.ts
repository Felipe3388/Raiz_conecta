import { describe, expect, it, vi } from "vitest";
import { lookupCep } from "./viacep";

const reply = (data: unknown, ok = true) => vi.fn().mockResolvedValue({ ok, json: async () => data });

describe("lookupCep", () => {
  it("devolve o endereço do CEP", async () => {
    const fetcher = reply({ logradouro: "Rua A", bairro: "Centro", localidade: "Votorantim", uf: "sp" });
    const result = await lookupCep("18110-000", undefined, fetcher);

    expect(fetcher.mock.calls[0][0]).toBe("https://viacep.com.br/ws/18110000/json/");
    expect(result).toEqual({ found: true, address: { rua: "Rua A", bairro: "Centro", cidade: "Votorantim", estado: "SP" } });
  });

  it("CEP que não existe, serviço fora do ar e sem internet viram mensagem", async () => {
    expect(await lookupCep("99999999", undefined, reply({ erro: true }))).toMatchObject({ found: false, error: expect.stringContaining("não encontrado") });
    expect(await lookupCep("99999999", undefined, reply({}, false))).toMatchObject({ found: false, error: expect.stringContaining("agora") });
    expect(await lookupCep("99999999", undefined, vi.fn().mockRejectedValue(new TypeError("net")))).toMatchObject({ found: false, error: expect.stringContaining("conexão") });
  });

  it("recusa CEP incompleto sem chamar o serviço", async () => {
    const fetcher = reply({});
    expect(await lookupCep("123", undefined, fetcher)).toMatchObject({ found: false });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("busca cancelada não mostra erro", async () => {
    const aborted = vi.fn().mockRejectedValue(new DOMException("x", "AbortError"));
    expect(await lookupCep("18110000", undefined, aborted)).toEqual({ found: false, error: "" });
  });
});
