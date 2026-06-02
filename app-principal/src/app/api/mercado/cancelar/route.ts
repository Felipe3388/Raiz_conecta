import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Calcula se a demanda está dentro do prazo de 7 dias úteis para cancelamento.
 * Dias úteis = segunda a sexta, excluindo fins de semana.
 */
function calcularDiasUteis(dataCriacao: Date): number {
  const hoje = new Date();
  let diasUteis = 0;
  const cursor = new Date(dataCriacao);

  // Avança dia por dia da criação até hoje
  cursor.setHours(0, 0, 0, 0);
  const hojeNormalizado = new Date(hoje);
  hojeNormalizado.setHours(0, 0, 0, 0);

  while (cursor < hojeNormalizado) {
    cursor.setDate(cursor.getDate() + 1);
    const diaSemana = cursor.getDay(); // 0=Dom, 6=Sab
    if (diaSemana !== 0 && diaSemana !== 6) {
      diasUteis++;
    }
  }

  return diasUteis;
}

const PRAZO_DIAS_UTEIS = 7;

// PATCH: Cancelar uma demanda (pedido) do mercado
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { demandaId, emailMercado, motivo } = body;

    if (!demandaId || !emailMercado) {
      return NextResponse.json(
        { error: "Dados insuficientes para o cancelamento." },
        { status: 400 }
      );
    }

    // Busca a demanda no banco
    const demanda = await prisma.demanda.findUnique({
      where: { id: demandaId },
      include: { ofertas: true },
    });

    if (!demanda) {
      return NextResponse.json(
        { error: "Pedido não encontrado." },
        { status: 404 }
      );
    }

    // Verifica se o pedido pertence ao mercado solicitante
    if (demanda.emailMercado !== emailMercado) {
      return NextResponse.json(
        { error: "Você não tem permissão para cancelar este pedido." },
        { status: 403 }
      );
    }

    // Verifica se já foi cancelado
    if (demanda.status === "CANCELADA") {
      return NextResponse.json(
        { error: "Este pedido já foi cancelado anteriormente." },
        { status: 400 }
      );
    }

    // Verifica se já foi concluída (entregue)
    if (demanda.status === "CONCLUIDA") {
      return NextResponse.json(
        { error: "Pedidos já entregues não podem ser cancelados. Entre em contato com o suporte." },
        { status: 400 }
      );
    }

    // Verifica o prazo de 7 dias úteis
    const diasPassados = calcularDiasUteis(demanda.criadoEm);

    if (diasPassados > PRAZO_DIAS_UTEIS) {
      return NextResponse.json(
        {
          error: `O prazo para cancelamento expirou. Cancelamentos são permitidos em até ${PRAZO_DIAS_UTEIS} dias úteis após o pedido. Este pedido foi feito há ${diasPassados} dias úteis.`,
          prazoExpirado: true,
          diasPassados,
          prazoMaximo: PRAZO_DIAS_UTEIS,
        },
        { status: 422 }
      );
    }

    // Cancela a demanda e todas as ofertas vinculadas
    await prisma.$transaction([
      prisma.oferta.updateMany({
        where: { demandaId },
        data: { status: "CANCELADA" },
      }),
      prisma.demanda.update({
        where: { id: demandaId },
        data: { status: "CANCELADA" },
      }),
    ]);

    return NextResponse.json(
      {
        message: "Pedido cancelado com sucesso.",
        detalhes: `Cancelamento realizado dentro do prazo (${diasPassados} de ${PRAZO_DIAS_UTEIS} dias úteis).`,
        reembolso: "O reembolso, se aplicável, será processado em até 5 dias úteis.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao cancelar demanda:", error);
    return NextResponse.json(
      { error: "Erro interno ao processar o cancelamento." },
      { status: 500 }
    );
  }
}
