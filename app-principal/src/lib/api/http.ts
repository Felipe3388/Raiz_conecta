import { NextResponse } from "next/server";

// Jeito único de responder erro nas rotas: { error: "mensagem" } com o status certo. Os dois apps (site e celular)
// só precisam ler `error`; campos extras (`extra`) ficam para casos como o prazo de cancelamento.
export function fail(status: number, error: string, extra: Record<string, unknown> = {}): NextResponse {
  return NextResponse.json({ error, ...extra }, { status });
}

// Corpo JSON da requisição, ou `null` se vier vazio ou quebrado (a rota responde 400 em vez de estourar).
export async function readJson<T extends object = Record<string, unknown>>(req: Request): Promise<T | null> {
  try {
    const body = await req.json();
    return body && typeof body === "object" && !Array.isArray(body) ? (body as T) : null;
  } catch {
    return null;
  }
}

// Erro inesperado: vira uma linha de log com `event` fixo (dá para contar e alertar por ele) e uma resposta 500
// sem detalhes internos.
export function serverError(event: string, error: unknown, message = "Erro interno no servidor."): NextResponse {
  console.error(
    JSON.stringify({
      level: "error",
      event,
      message: error instanceof Error ? error.message : String(error),
      code: prismaCode(error),
    }),
  );
  return fail(500, message);
}

// Código de erro do Prisma (P2002 = valor repetido, P2003 = ligado a outro registro, P2025 = não achou), se houver.
export function prismaCode(error: unknown): string | undefined {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code?: unknown }).code;
    if (typeof code === "string" && /^P\d{4}$/.test(code)) return code;
  }
  return undefined;
}

// Texto de um campo do corpo, sem espaços nas pontas. Qualquer outra coisa (número, objeto, vazio) vira "".
export function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

// O IP de quem chamou (o Vercel manda em x-forwarded-for), usado só para limitar tentativas.
export function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "desconhecido";
}
