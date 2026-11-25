import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth/session";
import { serverError } from "@/lib/api/http";
import { toScaleState } from "@/lib/iot/scales";

// As balanças do produtor logado (o e-mail é sempre o da sessão).
//
// Não há POST aqui: a balança entra na conta pelo pareamento feito no app (POST /api/produtor/balancas/pareamento) e
// termina quando o próprio módulo chama POST /api/iot/vincular.

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
