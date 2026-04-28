import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
  try {
    const { ofertaId, nota } = await req.json();

    if (!ofertaId || !nota) {
      return NextResponse.json(
        { error: "Dados incompletos para avaliação" },
        { status: 400 },
      );
    }

    // Atualiza a oferta marcando como entregue e salva a nota de 1 a 5
    await prisma.oferta.update({
      where: { id: ofertaId },
      data: {
        statusEntrega: "ENTREGUE",
        nota: Number(nota),
      },
    });

    return NextResponse.json(
      { message: "Recebimento e avaliação registrados com sucesso!" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Erro ao avaliar:", error);
    return NextResponse.json(
      { error: "Erro interno ao salvar avaliação" },
      { status: 500 },
    );
  }
}
