import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { emailMatches, forbiddenEmail, requireSession } from "@/lib/auth/session";
import { buildMural, validateOffer } from "@/lib/produtor/mural";
import { withSerializableRetry } from "@/lib/db/retry";

// Só produtor com cadastro aprovado mexe em ofertas.
async function approvedProducer(email: string) {
  return prisma.vendedor.findUnique({
    where: { email },
    include: { Estoques: { include: { Produto: true } } },
  });
}

const NOT_APPROVED = NextResponse.json({ error: "Seu cadastro ainda não foi aprovado." }, { status: 403 });

// GET: o mural do produtor logado. Devolve só o que ele pode responder (pedidos abertos dos produtos do catálogo dele),
// o que ele já ofertou e um resumo para o Painel. Não mostra e-mail de mercado nem de outros produtores.
export async function GET(req: Request) {
  const auth = await requireSession(req, ["produtor"]);
  if (auth.error) return auth.error;

  try {
    const vendedor = await approvedProducer(auth.session.email);
    if (!vendedor) return NextResponse.json({ error: "Produtor não encontrado" }, { status: 404 });
    if (vendedor.status !== "APROVADO") return NOT_APPROVED;

    const demandas = await prisma.demanda.findMany({
      include: { ofertas: { select: { quantidade: true, emailProdutor: true } } },
      orderBy: { criadoEm: "desc" },
    });
    const nomes = vendedor.Estoques.flatMap((estoque) => (estoque.Produto?.nome ? [estoque.Produto.nome] : []));

    return NextResponse.json({
      ...buildMural(demandas, vendedor.email, nomes),
      produtosNoCatalogo: vendedor.Estoques.length,
    });
  } catch (error) {
    console.error("Erro ao montar o mural:", error);
    return NextResponse.json({ error: "Erro ao buscar o mural" }, { status: 500 });
  }
}

// POST: o produtor garante uma quantidade de um pedido. Corpo: { demandaId, quantidade }.
// `emailProdutor` ainda é aceito (apps antigos), mas precisa ser o da própria sessão.
export async function POST(req: Request) {
  const auth = await requireSession(req, ["produtor"]);
  if (auth.error) return auth.error;

  try {
    const body = await req.json().catch(() => null);
    const { demandaId, quantidade, emailProdutor } = (body ?? {}) as {
      demandaId?: string;
      quantidade?: unknown;
      emailProdutor?: string;
    };

    if (!demandaId || quantidade === undefined || quantidade === null) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }
    if (!emailMatches(auth.session, emailProdutor)) return forbiddenEmail();

    const vendedor = await approvedProducer(auth.session.email);
    if (!vendedor) return NextResponse.json({ error: "Produtor não encontrado" }, { status: 404 });
    if (vendedor.status !== "APROVADO") return NOT_APPROVED;

    // Conferir o saldo e gravar acontecem na mesma transação serializável: duas ofertas ao mesmo tempo para o último
    // pedaço de um pedido não passam as duas. O prazo evita que um banco travado prenda a requisição.
    const result = await withSerializableRetry(() =>
      prisma.$transaction(
        async (tx) => {
          const demanda = await tx.demanda.findUnique({
            where: { id: demandaId },
            include: { ofertas: { select: { quantidade: true, emailProdutor: true } } },
          });
          if (!demanda) return { status: 404, error: "Demanda não encontrada" } as const;

          const problem = validateOffer(demanda, quantidade, vendedor.email);
          if (problem) return { status: 400, error: problem } as const;

          const qtdOfertada = Number(quantidade);
          const jaAtendida = demanda.ofertas.reduce((total, oferta) => total + oferta.quantidade, 0);

          await tx.oferta.create({ data: { quantidade: qtdOfertada, emailProdutor: vendedor.email, demandaId } });
          // O pedido fecha quando a última oferta completa a quantidade.
          if (jaAtendida + qtdOfertada >= demanda.quantidade) {
            await tx.demanda.update({ where: { id: demandaId }, data: { status: "CONCLUIDA" } });
          }
          return null;
        },
        { isolationLevel: "Serializable", maxWait: 2_000, timeout: 5_000 },
      ),
    );
    if (result) return NextResponse.json({ error: result.error }, { status: result.status });

    return NextResponse.json({ message: "Sua oferta foi registrada com sucesso!" }, { status: 201 });
  } catch (error) {
    console.error("Erro ao registrar oferta:", error);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}
