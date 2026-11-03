import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serverError } from "@/lib/api/http";
import { emailMatches, forbiddenEmail, requireSession } from "@/lib/auth/session";

// GET: Devolve os dados do produtor para montar a tela
export async function GET(req: Request) {
  const auth = await requireSession(req, ["produtor"]);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(req.url);
    if (!emailMatches(auth.session, searchParams.get("email"))) return forbiddenEmail();

    // Só os dados que a tela usa: documento, endereço e link do comprovante ficam de fora.
    const produtor = await prisma.vendedor.findFirst({
      where: { email: auth.session.email },
      select: { email: true, nomeFantasia: true, status: true, telefone: true, cidade: true, estado: true },
    });
    return NextResponse.json(produtor);
  } catch (error) {
    return serverError("produtor.perfil", error, "Erro ao buscar perfil");
  }
}
