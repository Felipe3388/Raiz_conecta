import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth/session";
import { fail, serverError } from "@/lib/api/http";
import { FailureLimiter } from "@/lib/security/rateLimit";
import { MAX_PAIRINGS_PER_WINDOW, PAIRING_TTL_MS, PAIRING_WINDOW_MS, generatePairingToken, hashPairingToken } from "@/lib/iot/pairing";

// Abre um pareamento: devolve o token que o app entrega à balança pela rede dela (Balanca_raiz_XXXX). O app precisa pedir
// ANTES de entrar nessa rede, porque o celular fica sem internet enquanto está nela.

// Cada pedido conta como uma "tentativa": passou de 10 em 15 minutos, espera (impede encher a tabela).
const limiter = new FailureLimiter({ max: MAX_PAIRINGS_PER_WINDOW, windowMs: PAIRING_WINDOW_MS });
const ONE_DAY_MS = 24 * 60 * 60_000;

export async function POST(req: Request) {
  const auth = await requireSession(req, ["produtor"]);
  if (auth.error) return auth.error;
  const { email } = auth.session;

  try {
    const wait = limiter.retryAfterSeconds(email);
    if (wait > 0) {
      const response = fail(429, `Muitas tentativas. Tente de novo em ${Math.ceil(wait / 60)} min.`);
      response.headers.set("Retry-After", String(wait));
      return response;
    }
    limiter.fail(email);

    const now = new Date();
    const token = generatePairingToken();
    const expiraEm = new Date(now.getTime() + PAIRING_TTL_MS);

    // Um pareamento aberto por produtor: os pedidos anteriores que ninguém usou saem, e os vencidos há mais de um dia também.
    const [, created] = await prisma.$transaction([
      prisma.pareamentoBalanca.deleteMany({
        where: {
          OR: [
            { emailProdutor: { equals: email, mode: "insensitive" }, usadoEm: null },
            { expiraEm: { lt: new Date(now.getTime() - ONE_DAY_MS) } },
          ],
        },
      }),
      prisma.pareamentoBalanca.create({ data: { tokenHash: hashPairingToken(token), emailProdutor: email, expiraEm } }),
    ]);

    // O token aparece só aqui; no banco fica o hash.
    return NextResponse.json({ id: created.id, token, expiraEm: expiraEm.toISOString() }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return serverError("balancas.pareamento.abrir", error, "Não foi possível iniciar o pareamento da balança.");
  }
}
