import { CepService } from "./CepService";

function jsonResponse(body: unknown, ok = true): Response {
  return new Response(JSON.stringify(body), { status: ok ? 200 : 500 });
}

describe("CepService", () => {
  it("consulta o ViaCEP só com os dígitos e devolve o endereço", async () => {
    const fetchMock = jest.fn().mockResolvedValue(
      jsonResponse({ logradouro: "Rua A", bairro: "Centro", localidade: "Votorantim", uf: "SP" }),
    );

    const result = await new CepService(fetchMock).lookup("18110-000");

    expect(fetchMock).toHaveBeenCalledWith("https://viacep.com.br/ws/18110000/json/");
    expect(result).toEqual({
      found: true,
      address: { rua: "Rua A", bairro: "Centro", cidade: "Votorantim", estado: "SP" },
    });
  });

  it("indica CEP não encontrado quando o ViaCEP responde erro", async () => {
    const fetchMock = jest.fn().mockResolvedValue(jsonResponse({ erro: true }));

    await expect(new CepService(fetchMock).lookup("99999999")).resolves.toEqual({ found: false });
  });

  it("não consulta quando o CEP não tem 8 dígitos", async () => {
    const fetchMock = jest.fn();

    await expect(new CepService(fetchMock).lookup("123")).resolves.toEqual({ found: false });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("falha com mensagem clara quando a consulta não funciona", async () => {
    const fetchMock = jest.fn().mockRejectedValue(new TypeError("offline"));

    await expect(new CepService(fetchMock).lookup("18110000")).rejects.toThrow(
      "Não foi possível consultar o CEP.",
    );
  });

  it("falha quando o ViaCEP responde com status de erro", async () => {
    const fetchMock = jest.fn().mockResolvedValue(jsonResponse({}, false));

    await expect(new CepService(fetchMock).lookup("18110000")).rejects.toThrow(
      "Não foi possível consultar o CEP.",
    );
  });

  it("usa o fetch global sem perder o contexto (no navegador isso evita 'Illegal invocation')", async () => {
    const original = globalThis.fetch;
    const fakeFetch = jest.fn(function (this: unknown) {
      if (this !== undefined && this !== globalThis) throw new TypeError("Illegal invocation");
      return Promise.resolve(jsonResponse({ erro: true }));
    });
    globalThis.fetch = fakeFetch as unknown as typeof fetch;

    try {
      await expect(new CepService().lookup("18110000")).resolves.toEqual({ found: false });
    } finally {
      globalThis.fetch = original;
    }
  });
});
