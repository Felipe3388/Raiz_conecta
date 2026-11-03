import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { emailMatches, forbiddenEmail, requireSession } from "@/lib/auth/session";
import { clientIp, fail, prismaCode, readJson, serverError } from "@/lib/api/http";
import { FailureLimiter } from "@/lib/security/rateLimit";
import { isValidPassword, PASSWORD_MESSAGE } from "@/lib/validation/auth";
import { parsePerfilChanges } from "@/lib/validation/perfil";

// Meus dados: cada pessoa vê, altera e exclui só a própria conta. O e-mail vem do token; `?email=` / `email` no corpo
// continuam aceitos (apps antigos), mas precisam ser o da sessão.

// Quem erra a senha atual 5 vezes em 15 minutos espera: com o token roubado não dá para adivinhar a senha por aqui.
const limiter = new FailureLimiter({ max: 5, windowMs: 15 * 60_000 });

// BUSCAR DADOS DO USUÁRIO
export async function GET(req: Request) {
  const auth = await requireSession(req, ["produtor", "mercado"]);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(req.url);
    if (!emailMatches(auth.session, searchParams.get("email"))) return forbiddenEmail();
    const email = auth.session.email;

    const acesso = await prisma.acesso.findFirst({ where: { login: email } });
    if (!acesso) return fail(404, "Usuário não encontrado");

    const dadosUsuario =
      acesso.tipoUser === "produtor" || acesso.cdVendedor
        ? await prisma.vendedor.findUnique({ where: { email } })
        : await prisma.cliente.findUnique({ where: { email } });

    // A senha e o endereço do documento enviado nunca saem daqui.
    if (dadosUsuario) {
      delete (dadosUsuario as { senha?: unknown }).senha;
      delete (dadosUsuario as { urlDocumento?: unknown }).urlDocumento;
    }
    return NextResponse.json({ ...dadosUsuario, tipoUser: acesso.tipoUser });
  } catch (error) {
    return serverError("perfil.ler", error, "Erro ao buscar dados");
  }
}

// ATUALIZAR DADOS E SENHA
export async function PUT(req: Request) {
  const auth = await requireSession(req);
  if (auth.error) return auth.error;
  if (auth.session.role === "admin") return fail(403, "Administradores não editam o perfil por aqui.");

  try {
    const body = await readJson(req);
    if (!body) return fail(400, "Envie os dados do perfil.");
    if (!emailMatches(auth.session, typeof body.email === "string" ? body.email : null)) return forbiddenEmail();
    const email = auth.session.email;

    // Só os campos editáveis entram; o perfil (produtor ou mercado) vem do token, não do corpo.
    const changes = parsePerfilChanges(body);
    if (!changes.ok) return fail(400, changes.error);

    const novaSenha = typeof body.novaSenha === "string" ? body.novaSenha.trim() : "";
    const writes = [];
    if (novaSenha) {
      if (!isValidPassword(novaSenha)) return fail(400, PASSWORD_MESSAGE);
      const senhaAtual = typeof body.senhaAtual === "string" ? body.senhaAtual : "";
      if (!senhaAtual) return fail(400, "Informe a senha atual para trocar a senha.");

      const key = `${clientIp(req)}|${email.toLowerCase()}`;
      const wait = limiter.retryAfterSeconds(key);
      if (wait > 0) {
        const response = fail(429, `Muitas tentativas. Tente de novo em ${Math.ceil(wait / 60)} min.`);
        response.headers.set("Retry-After", String(wait));
        return response;
      }

      const acesso = await prisma.acesso.findFirst({ where: { login: email }, select: { hash: true } });
      if (!acesso?.hash || !(await bcrypt.compare(senhaAtual, acesso.hash))) {
        limiter.fail(key);
        // 403 e não 401: o 401 do site significa "sessão vencida" e levaria ao login.
        return fail(403, "A senha atual está incorreta.");
      }
      limiter.reset(key);
      if (senhaAtual === novaSenha) return fail(400, "A nova senha precisa ser diferente da atual.");

      // O login compara com bcrypt: a senha nova precisa ser guardada com hash.
      writes.push(prisma.acesso.updateMany({ where: { login: email }, data: { hash: await bcrypt.hash(novaSenha, 10) } }));
    }

    writes.push(
      auth.session.role === "produtor"
        ? prisma.vendedor.update({ where: { email }, data: changes.data })
        : prisma.cliente.update({ where: { email }, data: changes.data }),
    );
    // Troca de senha e dados juntas ou nenhuma: não fica a senha nova com os dados antigos.
    await prisma.$transaction(writes);

    return NextResponse.json({ message: "Perfil atualizado com sucesso!" }, { status: 200 });
  } catch (error) {
    if (prismaCode(error) === "P2025") return fail(404, "Perfil não encontrado.");
    return serverError("perfil.atualizar", error, "Erro interno ao atualizar perfil");
  }
}

// EXCLUIR CONTA
export async function DELETE(req: Request) {
  const auth = await requireSession(req, ["produtor", "mercado"]);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(req.url);
    if (!emailMatches(auth.session, searchParams.get("email"))) return forbiddenEmail();
    const email = auth.session.email;

    // Juntos: se o perfil tem pedidos ligados e o banco não deixa apagar, o acesso (login) também fica.
    await prisma.$transaction([
      prisma.acesso.deleteMany({ where: { login: email } }),
      auth.session.role === "produtor" ? prisma.vendedor.delete({ where: { email } }) : prisma.cliente.delete({ where: { email } }),
    ]);

    const response = NextResponse.json({ message: "Conta excluída com sucesso!" }, { status: 200 });
    response.cookies.set("token", "", { path: "/", maxAge: 0 });
    return response;
  } catch (error) {
    if (prismaCode(error) === "P2003") {
      return fail(409, "Não é possível excluir: há pedidos ou ofertas vinculados a esta conta. Fale com o suporte.");
    }
    if (prismaCode(error) === "P2025") return fail(404, "Conta não encontrada.");
    return serverError("perfil.excluir", error, "Erro interno ao excluir a conta.");
  }
}
