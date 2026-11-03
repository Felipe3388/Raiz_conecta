import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth/session";
import { fail, prismaCode, readJson, serverError, text } from "@/lib/api/http";
import { EMAIL_MESSAGE, PASSWORD_MESSAGE, isValidEmail, isValidPassword } from "@/lib/validation/auth";

// Só um administrador logado cria outro administrador.
export async function POST(req: Request) {
  const auth = await requireSession(req, ["admin"]);
  if (auth.error) return auth.error;

  try {
    const body = await readJson(req);
    const email = text(body?.email).toLowerCase();
    const senha = typeof body?.senha === "string" ? body.senha : "";
    if (!email || !senha) return fail(400, "E-mail e senha são obrigatórios.");
    if (!isValidEmail(email)) return fail(400, EMAIL_MESSAGE);
    if (!isValidPassword(senha)) return fail(400, PASSWORD_MESSAGE);

    const existente = await prisma.acesso.findFirst({ where: { login: { equals: email, mode: "insensitive" } } });
    if (existente) return fail(409, "Este e-mail já está em uso no sistema.");

    await prisma.acesso.create({
      data: { login: email, hash: await bcrypt.hash(senha, 10), tipoUser: "admin", status: "APROVADO" },
    });

    return NextResponse.json({ message: "Novo administrador criado com sucesso!" }, { status: 201 });
  } catch (error) {
    if (prismaCode(error) === "P2002") return fail(409, "Este e-mail já está em uso no sistema.");
    return serverError("admin.novo_admin.falhou", error);
  }
}
