import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { getJwtSecret } from "@/lib/auth/jwt";
import { clientIp, fail, readJson, serverError, text } from "@/lib/api/http";
import { FailureLimiter } from "@/lib/security/rateLimit";

// O token dura 2 horas; o cookie dura o mesmo, para não sobrar cookie de uma sessão que já venceu.
const SESSION_SECONDS = 60 * 60 * 2;

// 5 erros de senha em 15 minutos (por IP + e-mail) travam novas tentativas por um tempo.
const limiter = new FailureLimiter({ max: 5, windowMs: 15 * 60_000 });

// Comparar contra um hash de mentira quando o e-mail não existe: sem isso, "e-mail não cadastrado" responderia mais
// rápido que "senha errada" e daria para descobrir quem tem conta.
const FAKE_HASH = bcrypt.hashSync("senha-que-ninguem-usa", 10);

export async function POST(req: Request) {
  try {
    const body = await readJson(req);
    const email = text(body?.email);
    const senha = typeof body?.senha === "string" ? body.senha : "";
    if (!email || !senha) return fail(400, "E-mail e senha são obrigatórios.");

    const key = `${clientIp(req)}|${email.toLowerCase()}`;
    const wait = limiter.retryAfterSeconds(key);
    if (wait > 0) {
      const response = fail(429, `Muitas tentativas. Tente de novo em ${Math.ceil(wait / 60)} min.`);
      response.headers.set("Retry-After", String(wait));
      return response;
    }

    // Sem diferenciar maiúsculas: "Maria@x.com" e "maria@x.com" são a mesma conta.
    const usuario = await prisma.acesso.findFirst({ where: { login: { equals: email, mode: "insensitive" } } });
    const senhaValida = await bcrypt.compare(senha, usuario?.hash || FAKE_HASH);
    if (!usuario || !usuario.hash || !senhaValida) {
      limiter.fail(key);
      return fail(401, "E-mail ou senha incorretos.");
    }
    limiter.reset(key);

    if (usuario.status === "SUSPENSO" || usuario.status === "REJEITADO") {
      return fail(403, "Sua conta foi suspensa ou rejeitada. Entre em contato com o suporte.");
    }

    // O e-mail do token é o gravado no banco, igual ao da tabela do produtor/mercado.
    const login = usuario.login ?? email;
    let nome = "Administrador";
    if (usuario.tipoUser === "produtor") {
      const produtor = await prisma.vendedor.findFirst({ where: { email: login }, select: { nomeFantasia: true } });
      nome = produtor?.nomeFantasia || login;
    } else if (usuario.tipoUser === "mercado") {
      const mercado = await prisma.cliente.findFirst({ where: { email: login }, select: { nomeFantasia: true } });
      nome = mercado?.nomeFantasia || login;
    }

    const token = jwt.sign({ email: login, role: usuario.tipoUser, nome, status: usuario.status }, getJwtSecret(), {
      expiresIn: SESSION_SECONDS,
    });

    const response = NextResponse.json({
      message: "Login realizado com sucesso!",
      token,
      user: { email: login, tipoUser: usuario.tipoUser, nome, status: usuario.status },
    });

    // httpOnly: o JavaScript da página não lê o cookie (o proxy e as rotas é que o conferem).
    response.cookies.set("token", token, {
      path: "/",
      maxAge: SESSION_SECONDS,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    return serverError("auth.login.falhou", error);
  }
}
