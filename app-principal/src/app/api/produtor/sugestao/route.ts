import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { emailMatches, forbiddenEmail, requireSession } from "@/lib/auth/session";
import { fail, prismaCode, serverError, text } from "@/lib/api/http";
import { IMAGE_TYPES, checkFile, optionalFile, removeByUrl, uploadFile } from "@/lib/media/upload";
import { notify } from "@/lib/notify/email";
import { parsePreco } from "@/lib/admin/produtos";

// GET: Admin lê as sugestões
export async function GET(req: Request) {
  const auth = await requireSession(req, ["admin"]);
  if (auth.error) return auth.error;

  try {
    return NextResponse.json(await prisma.sugestao.findMany({ orderBy: { criadoEm: "desc" } }));
  } catch (error) {
    return serverError("sugestao.listar", error, "Erro ao buscar");
  }
}

// POST: o produtor sugere um produto novo (nome, foto, descrição e preço por kg). O e-mail é o da sessão.
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

    await prisma.sugestao.create({
      data: { emailProdutor: auth.session.email, nomeProduto, descricao, imagemUrl, precoSugerido },
    });
    notify("sugestao", { emailProdutor: auth.session.email, nomeProduto, descricao, imagemUrl, precoSugerido });

    return NextResponse.json({ message: "Enviado com sucesso!" }, { status: 201 });
  } catch (error) {
    return serverError("sugestao.criar", error, "Erro no servidor");
  }
}

// DELETE: Admin apaga a sugestão (e a foto dela no Cloudinary).
export async function DELETE(req: Request) {
  const auth = await requireSession(req, ["admin"]);
  if (auth.error) return auth.error;

  try {
    const id = Number(new URL(req.url).searchParams.get("id"));
    if (!Number.isInteger(id) || id <= 0) return fail(400, "ID não informado");

    const sugestao = await prisma.sugestao.findUnique({ where: { id } });
    if (!sugestao) return fail(404, "Sugestão não encontrada");

    await prisma.sugestao.delete({ where: { id } });
    await removeByUrl(sugestao.imagemUrl, "sugestoes");
    return NextResponse.json({ message: "Apagado" });
  } catch (error) {
    if (prismaCode(error) === "P2025") return fail(404, "Sugestão não encontrada");
    return serverError("sugestao.apagar", error, "Erro");
  }
}
