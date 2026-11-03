import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { emailMatches, forbiddenEmail, requireSession } from "@/lib/auth/session";
import { fail, readJson, serverError, text } from "@/lib/api/http";
import { parseCarrinho, toPedido } from "@/lib/mercado/pedidos";

// POST: o mercado dispara uma cotação. Corpo: { carrinho: [{ id, qtd }] }. O nome, a unidade e o preço de referência
// de cada item vêm do catálogo (a tela só diz QUAL produto e QUANTO), e todos os pedidos nascem juntos ou nenhum.
// `emailMercado` ainda é aceito (apps antigos), mas precisa ser o da própria sessão.
export async function POST(req: Request) {
  const auth = await requireSession(req, ["mercado"]);
  if (auth.error) return auth.error;

  try {
    const body = await readJson(req);
    if (!emailMatches(auth.session, typeof body?.emailMercado === "string" ? body.emailMercado : null)) return forbiddenEmail();

    const carrinho = parseCarrinho(body?.carrinho);
    if (!carrinho.ok) return fail(400, carrinho.error);

    const mercado = await prisma.cliente.findFirst({ where: { email: auth.session.email }, select: { status: true } });
    if (!mercado) return fail(404, "Mercado não encontrado");
    if (mercado.status !== "APROVADO") return fail(403, "Seu cadastro ainda não foi aprovado.");

    const produtos = await prisma.produto.findMany({
      where: { cdProduto: { in: carrinho.itens.map((item) => item.id) }, OR: [{ status: "ATIVO" }, { status: null }] },
      select: { cdProduto: true, nome: true, preco: true, unidadePadrao: true },
    });
    const porId = new Map(produtos.map((produto) => [produto.cdProduto, produto]));
    if (carrinho.itens.some((item) => !porId.has(item.id))) {
      return fail(400, "Um dos produtos não está mais disponível. Atualize o catálogo e tente de novo.");
    }

    await prisma.$transaction(
      carrinho.itens.map((item) => {
        const produto = porId.get(item.id)!;
        return prisma.demanda.create({
          data: {
            produto: produto.nome ?? "Produto",
            quantidade: item.qtd,
            unidade: produto.unidadePadrao || "Kg",
            precoMedio: produto.preco ?? null,
            emailMercado: auth.session.email,
            status: "ABERTA",
          },
        });
      }),
    );

    return NextResponse.json({ message: "Demandas disparadas com sucesso!" }, { status: 201 });
  } catch (error) {
    return serverError("mercado.demanda.criar", error, "Erro interno ao salvar pedido");
  }
}

// GET: as cotações do mercado logado, com o progresso e as ofertas (com o NOME do produtor, nunca o e-mail).
export async function GET(req: Request) {
  const auth = await requireSession(req, ["mercado"]);
  if (auth.error) return auth.error;

  try {
    const demandas = await prisma.demanda.findMany({
      where: { emailMercado: { equals: auth.session.email, mode: "insensitive" } },
      include: { ofertas: { orderBy: { criadoEm: "asc" } } },
      orderBy: { criadoEm: "desc" },
    });

    const emails = [...new Set(demandas.flatMap((demanda) => demanda.ofertas.map((oferta) => oferta.emailProdutor)))];
    const produtores = emails.length
      ? await prisma.vendedor.findMany({ where: { email: { in: emails } }, select: { email: true, nomeFantasia: true } })
      : [];
    const nomes = new Map(produtores.map((produtor) => [produtor.email.toLowerCase(), text(produtor.nomeFantasia) || "Produtor"]));

    return NextResponse.json(demandas.map((demanda) => toPedido(demanda, nomes)));
  } catch (error) {
    return serverError("mercado.demanda.listar", error, "Erro ao buscar demandas");
  }
}
