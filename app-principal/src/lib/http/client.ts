// Chamadas à API feitas pelas telas do site. Um jeito só de chamar, de ler o erro e de reagir à sessão vencida.
// Nunca lança: devolve { ok, status, data, error } e a tela decide o que mostrar.

export interface ApiResult<T> {
  ok: boolean;
  // 0 = nem chegou ao servidor (sem internet).
  status: number;
  data: T | null;
  // Mensagem pronta para mostrar à pessoa (vazia quando deu certo).
  error: string;
}

export interface ApiOptions extends Omit<RequestInit, "body"> {
  // Corpo JSON (ajusta o Content-Type sozinho).
  json?: unknown;
  // Corpo de formulário com arquivo (o navegador define o Content-Type).
  form?: FormData;
  // Sessão vencida (401) leva ao login. Desligue onde o 401 é esperado (checar quem está logado, o próprio login).
  redirectOnUnauthorized?: boolean;
}

interface Deps {
  fetcher: typeof fetch;
  onUnauthorized: () => void;
}

const MESSAGES: Record<number, string> = {
  400: "Confira os dados e tente de novo.",
  401: "Sua sessão expirou. Entre novamente.",
  403: "Você não tem acesso a este recurso.",
  404: "Não encontramos o que você procurou.",
  409: "Esta ação conflita com o estado atual. Atualize a página e tente de novo.",
  429: "Muitas tentativas. Aguarde um pouco e tente de novo.",
};

export const NETWORK_ERROR = "Sem conexão com o servidor. Verifique sua internet e tente de novo.";

export function messageFor(status: number, data: unknown): string {
  const fromServer = data && typeof data === "object" ? (data as { error?: unknown }).error : null;
  if (typeof fromServer === "string" && fromServer.trim()) return fromServer;
  if (status >= 500) return "O servidor teve um problema. Tente de novo em instantes.";
  return MESSAGES[status] ?? "Não foi possível concluir. Tente de novo.";
}

let leaving = false;

function goToLogin() {
  if (typeof window === "undefined" || leaving || window.location.pathname === "/login") return;
  leaving = true;
  window.dispatchEvent(new Event("loginStateChange"));
  window.location.assign("/login");
}

const defaultDeps = (): Deps => ({ fetcher: (...args) => fetch(...args), onUnauthorized: goToLogin });

export async function api<T = unknown>(url: string, options: ApiOptions = {}, deps: Deps = defaultDeps()): Promise<ApiResult<T>> {
  const { json, form, headers, redirectOnUnauthorized = true, ...init } = options;
  const finalHeaders = json !== undefined ? { "Content-Type": "application/json", ...headers } : headers;

  let response: Response;
  try {
    response = await deps.fetcher(url, {
      credentials: "same-origin",
      ...init,
      headers: finalHeaders,
      body: json !== undefined ? JSON.stringify(json) : form,
    });
  } catch {
    return { ok: false, status: 0, data: null, error: NETWORK_ERROR };
  }

  const data = (await response.json().catch(() => null)) as T | null;
  if (response.status === 401 && redirectOnUnauthorized) deps.onUnauthorized();

  return {
    ok: response.ok,
    status: response.status,
    data,
    error: response.ok ? "" : messageFor(response.status, data),
  };
}
