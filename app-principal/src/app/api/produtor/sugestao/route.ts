import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { emailMatches, forbiddenEmail, requireSession } from "@/lib/auth/session";
import { fail, prismaCode, readJson, serverError, text } from "@/lib/api/http";
import { IMAGE_TYPES, checkFile, optionalFile, removeByUrl, uploadFile } from "@/lib/media/upload";
import { notify } from "@/lib/notify/email";
import { parsePreco } from "@/lib/admin/produtos";

// Produtor: histórico próprio (inclui aprovadas e recusadas).
// Admin: por padrão apenas pendentes para moderação; ?status=all lista o histórico completo.
export async function GET(req: Request) {
  const auth = await requireSession(req, ["admin", "produtor"]);
  if (auth.error) return auth.error;

  try {
    const isAdmin = auth.session.role === "admin";
    const all = new URL(req.url).searchParams.get("status") === "all";
    return NextResponse.json(await prisma.sugestao.findMany({
      where: isAdmin
        ? (all ? {} : { status: "EM_ANALISE" })
        : { emailProdutor: { equals: auth.session.email, mode: "insensitive" as const } },
      orderBy: { criadoEm: "desc" },
    }));
  } catch (error) {
    return serverError("sugestao.listar", error, "Erro ao buscar");
  }
}

// Envia uma sugestão para análise: retorna o ID real usado pelo histórico e pelo Desfazer.
export async function POST(req: Request) {
  const auth = await requireSession(req, ["produtor"]);
  if (auth.error) return auth.error;

  try {
    const form = await req.formData().catch(() => null);
    if (!form) return fail(400, "Envie os dados da sugestão.");
    const informado = form.get("emailProdutor");
    if (!emailMatches(auth.session, typeof informado === "string" ? informado : null)) return forbiddenEmail();

    const nomeProduto = text(form.get("nomeProduto"));
    if (nomeProduto.length < 2 || nomeProduto.length > 80) return fail(400, "Informe o nome do produto (até 80 letras).");
    const descricao = text(form.get("descricao")).slice(0, 500);
    const preco = parsePreco(text(form.get("precoSugerido")));
    const precoSugerido = Number.isFinite(preco) && preco > 0 ? Math.round(preco * 100) / 100 : null;

    let imagemUrl = "";
    const file = optionalFile(form.get("file"));
    if (file) {
      const problem = checkFile(file, IMAGE_TYPES);
      if (problem) return fail(400, problem);
      imagemUrl = await uploadFile(file, "sugestoes");
    }

    const registro = await prisma.sugestao.create({
      data: { emailProdutor: auth.session.email, nomeProduto, descricao, imagemUrl, precoSugerido },
    });
    notify("sugestao", { emailProdutor: auth.session.email, nomeProduto, descricao, imagemUrl, precoSugerido });

    return NextResponse.json({ message: "Enviado com sucesso!", id: registro.id, status: registro.status }, { status: 201 });
  } catch (error) {
    return serverError("sugestao.criar", error, "Erro no servidor");
  }
}

// Admin recusa mantendo o registro no histórico.
export async function PATCH(req: Request) {
  const auth = await requireSession(req, ["admin"]);
  if (auth.error) return auth.error;

  try {
    const body = await readJson(req);
    const id = Number(body?.id);
    if (!Number.isInteger(id) || id <= 0) return fail(400, "Informe o ID da sugestão.");
    if (body?.status !== "RECUSADA") return fail(400, "Status inválido.");
    const motivo = text(body?.motivo).slice(0, 500) || null;
    const existe = await prisma.sugestao.findUnique({ where: { id } });
    if (!existe) return fail(404, "Sugestão não encontrada.");
    if (existe.status !== "EM_ANALISE") return fail(409, "A sugestão já foi avaliada.");

    const result = await prisma.sugestao.updateMany({
      where: { id, status: "EM_ANALISE" },
      data: { status: "RECUSADA", motivo, decididoEm: new Date() },
    });
    if (result.count === 0) return fail(409, "A sugestão já foi avaliada.");
    return NextResponse.json({ message: "Sugestão recusada e preservada no histórico." });
  } catch (error) {
    return serverError("sugestao.recusar", error, "Não foi possível recusar a sugestão.");
  }
}

// Desfazer: apenas o produtor dono pode retirar a PRÓPRIA sugestão ainda pendente.
export async function DELETE(req: Request) {
  const auth = await requireSession(req, ["produtor"]);
  if (auth.error) return auth.error;

  try {
    const id = Number(new URL(req.url).searchParams.get("id"));
    if (!Number.isInteger(id) || id <= 0) return fail(400, "ID não informado");

    const sugestao = await prisma.sugestao.findFirst({
      where: { id, emailProdutor: { equals: auth.session.email, mode: "insensitive" as const } },
    });
    if (!sugestao) return fail(404, "Sugestão não encontrada");
    if (sugestao.status !== "EM_ANALISE") return fail(409, "Não é possível retirar uma sugestão já avaliada.");

    const result = await prisma.sugestao.deleteMany({
      where: { id, emailProdutor: { equals: auth.session.email, mode: "insensitive" as const }, status: "EM_ANALISE" },
    });
    if (result.count === 0) return fail(409, "A sugestão já foi avaliada.");
    await removeByUrl(sugestao.imagemUrl, "sugestoes");
    return NextResponse.json({ message: "Sugestão retirada" });
  } catch (error) {
    if (prismaCode(error) === "P2025") return fail(404, "Sugestão não encontrada");
    return serverError("sugestao.retirar", error, "Erro");
  }
}
