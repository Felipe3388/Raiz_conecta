import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth/session";
import { fail, prismaCode, readJson, serverError } from "@/lib/api/http";
import { parseProduto } from "@/lib/admin/produtos";

// Admin: transforma a sugestão de um produtor em produto oficial do catálogo (e apaga a sugestão).
export async function POST(req: Request) {
  const auth = await requireSession(req, ["admin"]);
  if (auth.error) return auth.error;

  try {
    const body = await readJson(req);
    const id = Number(body?.idSugestao);
    if (!Number.isInteger(id) || id <= 0) return fail(400, "ID da sugestão é obrigatório");

    const sugestao = await prisma.sugestao.findUnique({ where: { id } });
    if (!sugestao) return fail(404, "Sugestão não encontrada");

    // Os campos ajustados no modal valem; o que faltar vem da própria sugestão.
    const parsed = parseProduto({
      nome: body?.nome || sugestao.nomeProduto,
      tipo: body?.tipo,
      preco: body?.preco ?? sugestao.precoSugerido,
      unidadePadrao: body?.unidadePadrao,
      descricao: sugestao.descricao,
    });
    if (!parsed.ok) return fail(400, parsed.error);

    // Cria o produto e some com a sugestão juntos: não sobra sugestão repetida nem produto sem sugestão.
    await prisma.$transaction([
      prisma.produto.create({ data: { ...parsed.produto, imagemUrl: sugestao.imagemUrl, status: "ATIVO" } }),
      prisma.sugestao.delete({ where: { id } }),
    ]);

    return NextResponse.json({ message: "Sugestão promovida a produto!" });
  } catch (error) {
    if (prismaCode(error) === "P2025") return fail(404, "Sugestão não encontrada");
    return serverError("admin.sugestao.promover", error);
  }
}
