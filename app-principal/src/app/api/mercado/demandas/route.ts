/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST: Mercado disparando um novo pedido
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { emailMercado, carrinho } = body;

    if (!emailMercado || !carrinho || carrinho.length === 0) {
      return NextResponse.json(
        { error: "Dados inválidos ou carrinho vazio" },
        { status: 400 },
      );
    }

    // Para cada item no carrinho, cria uma "Demanda" no banco de dados
    const criacoes = carrinho.map((item: any) => {
      return prisma.demanda.create({
        data: {
          produto: item.nome,
          quantidade: item.qtd,
          unidade: item.unidade || "Kg",
          precoMedio: item.precoEstimado,
          emailMercado: emailMercado,
          status: "ABERTA",
        },
      });
    });

    // Executa todas as criações ao mesmo tempo para não travar o banco
    await Promise.all(criacoes);

    // Integração com microsserviço de e-mail para avisar produtores

    return NextResponse.json(
      { message: "Demandas disparadas com sucesso!" },
      { status: 201 },
    );
  } catch (error) {
    console.error("Erro ao disparar demanda:", error);
    return NextResponse.json(
      { error: "Erro interno ao salvar pedido" },
      { status: 500 },
    );
  }
}

// GET: Puxa as demandas abertas
export async function GET() {
  try {
    const demandas = await prisma.demanda.findMany({
      include: { ofertas: true }, // Traz quem fez oferta
      orderBy: { criadoEm: "desc" },
    });
    return NextResponse.json(demandas);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao buscar demandas" },
      { status: 500 },
    );
  }
}
