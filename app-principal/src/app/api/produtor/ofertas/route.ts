import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { demandaId, quantidade, emailProdutor } = await req.json();

    if (!demandaId || !quantidade || !emailProdutor) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    const qtdOfertada = Number(quantidade);

    // Busca o pedido original para saber o tamanho da "fatia" que falta
    const demanda = await prisma.demanda.findUnique({
      where: { id: demandaId },
      include: { ofertas: true },
    });

    if (!demanda) {
      return NextResponse.json(
        { error: "Demanda não encontrada" },
        { status: 404 },
      );
    }

    if (demanda.status === "CONCLUIDA") {
      return NextResponse.json(
        { error: "Este pedido já foi totalmente atendido." },
        { status: 400 },
      );
    }

    // Calcula quanto já foi garantido por outros produtores
    const qtdJaAtendida = demanda.ofertas.reduce(
      (acc, oferta) => acc + oferta.quantidade,
      0,
    );
    const qtdFaltante = demanda.quantidade - qtdJaAtendida;

    // Não deixa o produtor ofertar mais do que o mercado precisa
    if (qtdOfertada > qtdFaltante) {
      return NextResponse.json(
        {
          error: `O mercado só precisa de mais ${qtdFaltante} ${demanda.unidade} deste item.`,
        },
        { status: 400 },
      );
    }

    // Salva a oferta do produtor no banco
    await prisma.oferta.create({
      data: {
        quantidade: qtdOfertada,
        emailProdutor,
        demandaId,
      },
    });

    //  Fecha a demanda automaticamente se já tiver sido totalmente atendida
    if (qtdJaAtendida + qtdOfertada >= demanda.quantidade) {
      await prisma.demanda.update({
        where: { id: demandaId },
        data: { status: "CONCLUIDA" },
      });
    }

    return NextResponse.json(
      { message: "Sua oferta foi registrada com sucesso!" },
      { status: 201 },
    );
  } catch (error) {
    console.error("Erro ao registrar oferta:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor" },
      { status: 500 },
    );
  }
}
