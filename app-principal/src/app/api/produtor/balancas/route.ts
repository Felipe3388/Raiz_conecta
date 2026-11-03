import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth/session";
import { fail, readJson, serverError, text } from "@/lib/api/http";
import { FailureLimiter } from "@/lib/security/rateLimit";
import { isValidDeviceId, normalizeDeviceId } from "@/lib/iot/deviceId";
import { AlreadyLinkedError, activateScale, claimScale } from "@/lib/iot/links";
import { codeMatches } from "@/lib/iot/pairing";
import { toScaleLink, toScaleState } from "@/lib/iot/scales";

// As balanças do produtor logado (o e-mail é sempre o da sessão).

// Quem erra o código da etiqueta muitas vezes está tentando adivinhar: 8 erros em 15 minutos travam por um tempo.
const limiter = new FailureLimiter({ max: 8, windowMs: 15 * 60_000 });

const mine = (email: string) => ({ equals: email, mode: "insensitive" as const });

// GET: as balanças e qual está conectada.
export async function GET(req: Request) {
  const auth = await requireSession(req, ["produtor"]);
  if (auth.error) return auth.error;

  try {
    const rows = await prisma.balanca.findMany({ where: { emailProdutor: mine(auth.session.email) } });
    return NextResponse.json(toScaleState(rows, auth.session.email));
  } catch (error) {
    return serverError("balancas.listar", error, "Não foi possível carregar suas balanças.");
  }
}

// POST { deviceId, codigo }: vincula a balança (o código vem na etiqueta) e a deixa conectada.
export async function POST(req: Request) {
  const auth = await requireSession(req, ["produtor"]);
  if (auth.error) return auth.error;
  const { email } = auth.session;

  try {
    const body = await readJson(req);
    const informed = text(body?.deviceId);
    if (!isValidDeviceId(informed)) return fail(400, "Identificação da balança inválida.");
    const deviceId = normalizeDeviceId(informed);
    const codigo = text(body?.codigo);

    const wait = limiter.retryAfterSeconds(email);
    if (wait > 0) {
      const response = fail(429, `Muitas tentativas. Tente de novo em ${Math.ceil(wait / 60)} min.`);
      response.headers.set("Retry-After", String(wait));
      return response;
    }

    const balanca = await prisma.balanca.findUnique({ where: { deviceId } });

    // Já é dele: adicionar de novo só a deixa conectada (sem pedir o código outra vez).
    if (balanca?.emailProdutor?.toLowerCase() === email.toLowerCase()) {
      await prisma.$transaction((tx) => activateScale(tx, email, deviceId));
      return NextResponse.json(toScaleLink({ ...balanca, conectada: true }, email));
    }

    if (!codigo) return fail(400, "Digite o código que está na etiqueta da balança.");
    // Código errado e balança que não existe respondem igual: ninguém descobre quais balanças existem.
    if (!balanca || !codeMatches(codigo, deviceId)) {
      limiter.fail(email);
      return fail(404, "Não encontramos essa balança. Confira o código da etiqueta.");
    }
    if (balanca.emailProdutor) return fail(409, "Esta balança já está vinculada a outra conta.");

    const now = new Date();
    try {
      await prisma.$transaction((tx) => claimScale(tx, email, deviceId, now));
    } catch (error) {
      if (error instanceof AlreadyLinkedError) return fail(409, "Esta balança já está vinculada a outra conta.");
      throw error;
    }
    limiter.reset(email);

    return NextResponse.json(
      toScaleLink({ ...balanca, emailProdutor: email, vinculadaEm: now, apelido: null, conectada: true }, email),
      { status: 201 },
    );
  } catch (error) {
    return serverError("balancas.vincular", error, "Não foi possível vincular a balança.");
  }
}
