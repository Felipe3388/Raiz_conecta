import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { fail, serverError } from "@/lib/api/http";
import { prisma } from "@/lib/prisma";

// Quem está logado agora. A situação da conta (EM_ANALISE, APROVADO...) e o nome vêm do banco, não do token: o token
// foi criado no login, a aprovação pode ter acontecido depois e a pessoa pode ter trocado o nome no perfil.
export async function GET(req: Request) {
  const auth = await requireSession(req);
  if (auth.error) return auth.error;

  try {
    const { email, role } = auth.session;
    const acesso = await prisma.acesso.findFirst({ where: { login: email }, select: { status: true } });
    if (!acesso) return fail(401, "Sessão expirada. Entre novamente.");

    let nome = auth.session.nome;
    if (role === "produtor") nome = (await prisma.vendedor.findFirst({ where: { email }, select: { nomeFantasia: true } }))?.nomeFantasia || nome;
    else if (role === "mercado") nome = (await prisma.cliente.findFirst({ where: { email }, select: { nomeFantasia: true } }))?.nomeFantasia || nome;

    const response = NextResponse.json({ email, role, nome, status: acesso.status });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    return serverError("auth.me", error);
  }
}
