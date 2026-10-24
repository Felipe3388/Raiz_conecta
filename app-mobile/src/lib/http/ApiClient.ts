import { ApiError } from "./ApiError";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface ApiClientOptions {
  baseUrl: string;
  getToken: () => Promise<string | null>;
  fetchImpl?: typeof fetch;
}

export class ApiClient {
  constructor(private readonly options: ApiClientOptions) {}

  get<T>(path: string): Promise<T> {
    return this.request<T>("GET", path);
  }

  post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("POST", path, toJsonPayload(body));
  }

  put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("PUT", path, toJsonPayload(body));
  }

  delete<T>(path: string): Promise<T> {
    return this.request<T>("DELETE", path);
  }

  patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("PATCH", path, toJsonPayload(body));
  }

  // Envio multipart (ex.: cadastro com foto). O Content-Type, com o boundary, é definido pelo fetch.
  postForm<T>(path: string, form: FormData): Promise<T> {
    return this.request<T>("POST", path, { body: form });
  }

  private async request<T>(method: HttpMethod, path: string, payload?: Payload): Promise<T> {
    const headers: Record<string, string> = { Accept: "application/json" };

    const token = await this.options.getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    if (payload?.contentType) headers["Content-Type"] = payload.contentType;

    const response = await this.send(`${this.options.baseUrl}${path}`, {
      method,
      headers,
      body: payload?.body,
    });

    const data = await readJson(response);
    if (!response.ok) {
      throw new ApiError(errorMessageFrom(data) ?? `Erro inesperado (${response.status}).`, response.status);
    }
    return data as T;
  }

  private async send(url: string, init: RequestInit): Promise<Response> {
    try {
      return await (this.options.fetchImpl ?? fetch)(url, init);
    } catch {
      throw new ApiError("Não foi possível conectar ao servidor.", 0);
    }
  }
}

interface Payload {
  body: BodyInit;
  contentType?: string;
}

function toJsonPayload(body: unknown): Payload | undefined {
  if (body === undefined) return undefined;
  return { body: JSON.stringify(body), contentType: "application/json" };
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return JSON.parse(await response.text());
  } catch {
    return null;
  }
}

// A API responde erros no formato { error: "mensagem" }.
function errorMessageFrom(data: unknown): string | null {
  if (typeof data === "object" && data !== null && "error" in data) {
    const { error } = data as { error: unknown };
    if (typeof error === "string" && error) return error;
  }
  return null;
}
