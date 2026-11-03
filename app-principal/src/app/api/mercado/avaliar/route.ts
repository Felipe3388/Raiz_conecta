import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth/session";
import { fail, readJson, serverError, text } from "@/lib/api/http";

// PATCH: o mercado confirma que recebeu a oferta de um produtor e dá nota de 1 a 5. Só para ofertas dos pedidos dele,
// e só uma vez por oferta.
export async function PATCH(req: Request) {
  const auth = await requireSession(req, ["mercado"]);
  if (auth.error) return auth.error;

  try {
    const body = await readJson(req);
    const ofertaId = text(body?.ofertaId);
    const nota = Number(body?.nota);
    if (!ofertaId || body?.nota === undefined) return fail(400, "Dados incompletos para avaliação");
    if (!Number.isInteger(nota) || nota < 1 || nota > 5) return fail(400, "A nota deve ser de 1 a 5.");

    const oferta = await prisma.oferta.findUnique({
      where: { id: ofertaId },
      select: { status: true, statusEntrega: true, demanda: { select: { emailMercado: true } } },
    });
    // Oferta de outro mercado responde igual a "não existe": ninguém descobre ids alheios.
    if (!oferta || oferta.demanda.emailMercado.toLowerCase() !== auth.session.email.toLowerCase()) {
      return fail(404, "Oferta não encontrada");
    }
    if (oferta.status === "CANCELADA") return fail(400, "Esta oferta foi cancelada.");

    // A condição vai junto da gravação: dois cliques ao mesmo tempo não avaliam duas vezes.
    const { count } = await prisma.oferta.updateMany({
      where: { id: ofertaId, statusEntrega: { not: "ENTREGUE" } },
      data: { statusEntrega: "ENTREGUE", nota },
    });
    if (count === 0) return fail(409, "Esta entrega já foi confirmada.");

    return NextResponse.json({ message: "Recebimento e avaliação registrados com sucesso!" });
  } catch (error) {
    return serverError("mercado.avaliar", error, "Erro interno ao salvar avaliação");
  }
}
