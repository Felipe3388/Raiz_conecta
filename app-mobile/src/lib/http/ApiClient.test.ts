import { ApiClient } from "./ApiClient";
import { ApiError } from "./ApiError";

const BASE_URL = "http://api.test";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

function createClient(fetchImpl: jest.Mock, token: string | null = null) {
  return new ApiClient({
    baseUrl: BASE_URL,
    getToken: async () => token,
    fetchImpl,
  });
}

describe("ApiClient", () => {
  it("monta a URL com baseUrl + path e não envia Authorization sem token", async () => {
    const fetchMock = jest.fn().mockResolvedValue(jsonResponse([{ id: 1 }]));

    const data = await createClient(fetchMock).get("/api/produtos");

    expect(data).toEqual([{ id: 1 }]);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://api.test/api/produtos");
    expect(init.method).toBe("GET");
    expect(init.headers.Authorization).toBeUndefined();
  });

  it("envia o token como Bearer quando existe", async () => {
    const fetchMock = jest.fn().mockResolvedValue(jsonResponse({}));

    await createClient(fetchMock, "abc123").get("/api/qualquer");

    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe("Bearer abc123");
  });

  it("serializa o corpo do POST como JSON", async () => {
    const fetchMock = jest.fn().mockResolvedValue(jsonResponse({ ok: true }, 201));

    await createClient(fetchMock).post("/api/auth/login", {
      email: "a@b.com",
      senha: "x",
    });

    const init = fetchMock.mock.calls[0][1];
    expect(init.method).toBe("POST");
    expect(init.headers["Content-Type"]).toBe("application/json");
    expect(init.body).toBe(JSON.stringify({ email: "a@b.com", senha: "x" }));
  });

  it("lança ApiError com a mensagem e o status devolvidos pela API", async () => {
    const fetchMock = jest.fn().mockResolvedValue(jsonResponse({ error: "E-mail ou senha incorretos." }, 401));

    const promise = createClient(fetchMock).post("/api/auth/login", {});

    await expect(promise).rejects.toBeInstanceOf(ApiError);
    await expect(promise).rejects.toMatchObject({
      message: "E-mail ou senha incorretos.",
      status: 401,
    });
  });

  it("usa mensagem genérica quando o erro não vem em JSON", async () => {
    const fetchMock = jest.fn().mockResolvedValue(new Response("<html>oops</html>", { status: 500 }));

    await expect(createClient(fetchMock).get("/x")).rejects.toMatchObject({
      message: "Erro inesperado (500).",
      status: 500,
    });
  });

  it("converte falha de rede em ApiError com status 0", async () => {
    const fetchMock = jest.fn().mockRejectedValue(new TypeError("Network request failed"));

    await expect(createClient(fetchMock).get("/x")).rejects.toMatchObject({
      message: "Não foi possível conectar ao servidor.",
      status: 0,
    });
  });

  it("envia FormData sem fixar o Content-Type (o boundary é definido pelo fetch)", async () => {
    const fetchMock = jest.fn().mockResolvedValue(jsonResponse({ ok: true }, 201));
    const form = new FormData();
    form.append("email", "a@b.com");

    await createClient(fetchMock, "abc123").postForm("/api/auth/cadastro", form);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://api.test/api/auth/cadastro");
    expect(init.method).toBe("POST");
    expect(init.body).toBe(form);
    expect(init.headers["Content-Type"]).toBeUndefined();
    expect(init.headers.Authorization).toBe("Bearer abc123");
  });
});

describe("ApiClient: PUT e DELETE", () => {
  it("put envia JSON e delete não envia corpo", async () => {
    const fetchMock = jest.fn().mockResolvedValue(jsonResponse({ message: "ok" }));
    const client = createClient(fetchMock);

    await client.put("/api/perfil/meus-dados", { email: "a@b.c" });
    await client.delete("/api/perfil/meus-dados?email=a%40b.c");

    const [, putInit] = fetchMock.mock.calls[0];
    expect(putInit.method).toBe("PUT");
    expect(putInit.body).toBe(JSON.stringify({ email: "a@b.c" }));
    const [deleteUrl, deleteInit] = fetchMock.mock.calls[1];
    expect(deleteUrl).toBe("http://api.test/api/perfil/meus-dados?email=a%40b.c");
    expect(deleteInit.method).toBe("DELETE");
    expect(deleteInit.body).toBeUndefined();
  });
});
