import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth/session";
import { fail, prismaCode, readJson, serverError, text } from "@/lib/api/http";
import { emailForStatus, isManagedType, isUserStatus, pickUserEdit } from "@/lib/admin/usuarios";
import { notify } from "@/lib/notify/email";

// Gestão de usuários: só o administrador. Cada rota confere a sessão (o proxy só protege as páginas).

// Tudo o que a tela do admin precisa de cada conta — sem a coluna `senha` antiga.
const PERFIL_SELECT = {
  email: true, nomeFantasia: true, razaoSocial: true, documento: true, tipoDoc: true, telefone: true,
  cidade: true, estado: true, status: true, urlDocumento: true, criadoEm: true,
} as const;

// GET: produtores, mercados e administradores (da mais antiga à mais nova conta dentro de cada tipo).
export async function GET(req: Request) {
  const auth = await requireSession(req, ["admin"]);
  if (auth.error) return auth.error;

  try {
    const [produtores, mercados, admins] = await Promise.all([
      prisma.vendedor.findMany({ select: PERFIL_SELECT, orderBy: { nomeFantasia: "asc" } }),
      prisma.cliente.findMany({ select: PERFIL_SELECT, orderBy: { nomeFantasia: "asc" } }),
      prisma.acesso.findMany({ where: { tipoUser: "admin" }, select: { login: true, status: true } }),
    ]);

    return NextResponse.json([
      ...produtores.map((p) => ({ ...p, tipo: "produtor" })),
      ...mercados.map((m) => ({ ...m, tipo: "mercado" })),
      ...admins.map((a) => ({ email: a.login, nomeFantasia: "Administrador", status: a.status, tipo: "admin" })),
    ]);
  } catch (error) {
    return serverError("admin.usuarios.listar", error, "Erro ao buscar usuários");
  }
}

// PUT: muda o status (aprovar, rejeitar, suspender, reativar) e avisa o usuário por e-mail.
export async function PUT(req: Request) {
  const auth = await requireSession(req, ["admin"]);
  if (auth.error) return auth.error;

  try {
    const body = await readJson(req);
    const email = text(body?.email);
    const motivo = text(body?.motivo);
    if (!email || !isManagedType(body?.tipo) || !isUserStatus(body?.novoStatus)) return fail(400, "Dados inválidos");
    const { tipo, novoStatus } = body as { tipo: "produtor" | "mercado"; novoStatus: Parameters<typeof emailForStatus>[0] };

    // O perfil e o acesso mudam juntos: nunca fica um aprovado e o outro não.
    const data = novoStatus === "REJEITADO" ? { status: novoStatus, urlDocumento: null } : { status: novoStatus };
    await prisma.$transaction([
      tipo === "produtor"
        ? prisma.vendedor.update({ where: { email }, data })
        : prisma.cliente.update({ where: { email }, data }),
      prisma.acesso.updateMany({ where: { login: email }, data: { status: novoStatus } }),
    ]);

    const kind = emailForStatus(novoStatus);
    if (kind) notify(kind, { email, ...(kind === "suspensao" ? { motivo } : {}) });

    return NextResponse.json({ message: `Status alterado para ${novoStatus}` });
  } catch (error) {
    if (prismaCode(error) === "P2025") return fail(404, "Usuário não encontrado.");
    return serverError("admin.usuarios.status", error, "Erro ao atualizar");
  }
}

// PATCH: o administrador corrige nome, telefone, cidade ou estado.
export async function PATCH(req: Request) {
  const auth = await requireSession(req, ["admin"]);
  if (auth.error) return auth.error;

  try {
    const body = await readJson(req);
    const email = text(body?.email);
    if (!email || !isManagedType(body?.tipo)) return fail(400, "Dados inválidos");

    const data = pickUserEdit(body ?? {});
    if (Object.keys(data).length === 0) return fail(400, "Nenhum dado para atualizar.");

    if (body?.tipo === "produtor") await prisma.vendedor.update({ where: { email }, data });
    else await prisma.cliente.update({ where: { email }, data });

    return NextResponse.json({ message: "Usuário atualizado com sucesso" });
  } catch (error) {
    if (prismaCode(error) === "P2025") return fail(404, "Usuário não encontrado.");
    return serverError("admin.usuarios.editar", error, "Erro ao atualizar usuário");
  }
}

// DELETE: exclui a conta de vez. Só produtor e mercado (um administrador não apaga outro por aqui).
export async function DELETE(req: Request) {
  const auth = await requireSession(req, ["admin"]);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(req.url);
    const email = text(searchParams.get("email"));
    const tipo = searchParams.get("tipo");
    const motivo = text(searchParams.get("motivo"));
    if (!email || !isManagedType(tipo)) return fail(400, "Dados inválidos");

    await prisma.$transaction([
      prisma.acesso.deleteMany({ where: { login: email } }),
      tipo === "produtor" ? prisma.vendedor.delete({ where: { email } }) : prisma.cliente.delete({ where: { email } }),
    ]);

    notify("exclusao", { email, motivo });
    return NextResponse.json({ message: "Usuário excluído com sucesso" });
  } catch (error) {
    if (prismaCode(error) === "P2025") return fail(404, "Usuário não encontrado.");
    // Produtor com ofertas ou mercado com pedidos não pode sumir: o histórico depende dele.
    if (prismaCode(error) === "P2003") return fail(409, "Não dá para excluir: há pedidos ou itens ligados a esta conta. Suspenda-a em vez disso.");
    return serverError("admin.usuarios.excluir", error, "Erro ao excluir.");
  }
}
