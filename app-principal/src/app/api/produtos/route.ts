import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, requireSession } from "@/lib/auth/session";
import { fail, prismaCode, readJson, serverError } from "@/lib/api/http";
import { parseProduto } from "@/lib/admin/produtos";
import { IMAGE_TYPES, checkFile, optionalFile, removeByUrl, uploadFile } from "@/lib/media/upload";

// Campos de um produto, vindos de um formulário (com foto) ou de JSON (a tela antiga do admin e o mobile).
async function readProdutoBody(req: Request): Promise<{ raw: Record<string, unknown>; file: File | null } | null> {
  if ((req.headers.get("content-type") ?? "").includes("multipart/form-data")) {
    const form = await req.formData().catch(() => null);
    if (!form) return null;
    return { raw: Object.fromEntries([...form.entries()].filter(([, value]) => typeof value === "string")), file: optionalFile(form.get("file")) };
  }
  const raw = await readJson(req);
  return raw ? { raw, file: null } : null;
}

// GET: o catálogo oficial. Quem não é administrador só vê produtos ativos; o admin pede `?todos=1` para ver também os
// inativos (produtos que saíram da vitrine mas têm produtor ou pedido ligado).
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const verTodos = searchParams.get("todos") === "1" && (await getSession(req))?.role === "admin";
    const produtos = await prisma.produto.findMany({
      where: verTodos ? undefined : { OR: [{ status: "ATIVO" }, { status: null }] },
      orderBy: { nome: "asc" },
    });
    return NextResponse.json(produtos);
  } catch (error) {
    return serverError("produtos.listar", error, "Erro ao buscar produtos");
  }
}

// POST (admin): cadastra um produto, com foto opcional.
export async function POST(req: Request) {
  const auth = await requireSession(req, ["admin"]);
  if (auth.error) return auth.error;

  try {
    const body = await readProdutoBody(req);
    if (!body) return fail(400, "Envie os dados do produto.");
    const parsed = parseProduto(body.raw);
    if (!parsed.ok) return fail(400, parsed.error);

    let imagemUrl: string | null = null;
    if (body.file) {
      const problem = checkFile(body.file, IMAGE_TYPES);
      if (problem) return fail(400, problem);
      imagemUrl = await uploadFile(body.file, "produtos");
    }

    const novo = await prisma.produto.create({ data: { ...parsed.produto, imagemUrl, status: "ATIVO" } });
    return NextResponse.json(novo, { status: 201 });
  } catch (error) {
    return serverError("produtos.criar", error, "Erro ao cadastrar o produto");
  }
}

// PUT (admin): edita o produto; uma foto nova troca a antiga.
export async function PUT(req: Request) {
  const auth = await requireSession(req, ["admin"]);
  if (auth.error) return auth.error;

  try {
    const body = await readProdutoBody(req);
    if (!body) return fail(400, "Envie os dados do produto.");
    const id = Number(body.raw.id);
    if (!Number.isInteger(id) || id <= 0) return fail(400, "ID do produto é obrigatório");
    const parsed = parseProduto(body.raw);
    if (!parsed.ok) return fail(400, parsed.error);

    const atual = await prisma.produto.findUnique({ where: { cdProduto: id }, select: { imagemUrl: true } });
    if (!atual) return fail(404, "Produto não encontrado");

    let imagemUrl: string | undefined;
    if (body.file) {
      const problem = checkFile(body.file, IMAGE_TYPES);
      if (problem) return fail(400, problem);
      imagemUrl = await uploadFile(body.file, "produtos");
    }

    // O admin também reativa um produto que foi desativado (status ATIVO) ou o tira da vitrine (INATIVO).
    const status = body.raw.status === "ATIVO" || body.raw.status === "INATIVO" ? body.raw.status : undefined;
    const atualizado = await prisma.produto.update({
      where: { cdProduto: id },
      data: { ...parsed.produto, ...(imagemUrl ? { imagemUrl } : {}), ...(status ? { status } : {}) },
    });
    // Só depois de gravar a nova é que a antiga some: se algo falhar antes, o produto não fica sem foto.
    if (imagemUrl) await removeByUrl(atual.imagemUrl, "produtos");

    return NextResponse.json(atualizado);
  } catch (error) {
    if (prismaCode(error) === "P2025") return fail(404, "Produto não encontrado");
    return serverError("produtos.editar", error, "Erro ao atualizar produto");
  }
}

// DELETE (admin): tira o produto do catálogo. Se algum produtor já o vende ou há pedido com ele, o produto é só
// desativado (some da vitrine, o histórico continua); sem ligação nenhuma ele é apagado de vez.
export async function DELETE(req: Request) {
  const auth = await requireSession(req, ["admin"]);
  if (auth.error) return auth.error;

  try {
    const id = Number(new URL(req.url).searchParams.get("id"));
    if (!Number.isInteger(id) || id <= 0) return fail(400, "ID não informado");

    const produto = await prisma.produto.findUnique({ where: { cdProduto: id } });
    if (!produto) return fail(404, "Produto não encontrado");

    const [vendedores, pedidos] = await Promise.all([
      prisma.prod_Vendedor_Possui.count({ where: { cdProduto: id } }),
      prisma.itemPedido.count({ where: { cdProduto: id } }),
    ]);
    if (vendedores + pedidos > 0) {
      await prisma.produto.update({ where: { cdProduto: id }, data: { status: "INATIVO" } });
      return NextResponse.json({ message: "O produto tem produtores ou pedidos ligados: foi desativado em vez de apagado.", desativado: true });
    }

    await prisma.produto.delete({ where: { cdProduto: id } });
    await removeByUrl(produto.imagemUrl, "produtos");
    return NextResponse.json({ message: "Produto apagado com sucesso" });
  } catch (error) {
    return serverError("produtos.apagar", error, "Erro ao apagar o produto");
  }
}
