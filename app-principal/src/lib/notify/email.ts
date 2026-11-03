import { after } from "next/server";

// Avisos por e-mail (microsserviço app-node). Nenhuma rota espera por eles: `defer` os manda depois de a resposta
// sair e, se o microsserviço estiver fora do ar ou lento (3 s), só registra no log.
export type EmailKind = "boas-vindas" | "aprovacao" | "rejeicao" | "suspensao" | "exclusao" | "sugestao";

const TIMEOUT_MS = 3_000;

export async function sendEmail(kind: EmailKind, payload: Record<string, unknown>): Promise<void> {
  const base = process.env.MICROSERVICE_URL;
  if (!base) return;
  try {
    const res = await fetch(`${base}/api/email/${kind}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  } catch (error) {
    console.error(JSON.stringify({ level: "warn", event: `email.${kind}.falhou`, message: error instanceof Error ? error.message : String(error) }));
  }
}

// Roda a tarefa depois da resposta (`after` do Next). Fora de uma requisição (testes, scripts) ela só dispara.
export function defer(task: () => Promise<unknown>): void {
  try {
    after(task);
  } catch {
    void task().catch(() => {});
  }
}

export function notify(kind: EmailKind, payload: Record<string, unknown>): void {
  if (process.env.MICROSERVICE_URL) defer(() => sendEmail(kind, payload));
}
