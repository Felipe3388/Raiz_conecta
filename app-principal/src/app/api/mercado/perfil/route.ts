import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { emailMatches, forbiddenEmail, requireSession } from "@/lib/auth/session";
import { fail, serverError } from "@/lib/api/http";

// GET: os dados do mercado logado (só o que as telas usam: nada de senha antiga nem link do documento).
export async function GET(req: Request) {
  const auth = await requireSession(req, ["mercado"]);
  if (auth.error) return auth.error;

  try {
    if (!emailMatches(auth.session, new URL(req.url).searchParams.get("email"))) return forbiddenEmail();

    const mercado = await prisma.cliente.findFirst({
      where: { email: auth.session.email },
      select: { email: true, nomeFantasia: true, status: true, telefone: true, cidade: true, estado: true, rua: true, numero: true, bairro: true, cep: true },
    });
    if (!mercado) return fail(404, "Mercado não encontrado");
    return NextResponse.json(mercado);
  } catch (error) {
    return serverError("mercado.perfil", error, "Erro interno");
  }
}
