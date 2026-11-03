import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { emailMatches, forbiddenEmail, requireSession } from "@/lib/auth/session";
import { fail, readJson, serverError, text } from "@/lib/api/http";
import { PRAZO_CANCELAMENTO_DIAS_UTEIS, diasUteisDesde } from "@/lib/mercado/pedidos";

// PATCH: o mercado cancela um pedido dentro de 7 dias úteis. Só os pedidos dele, e só os que ainda estão abertos.
export async function PATCH(req: Request) {
  const auth = await requireSession(req, ["mercado"]);
  if (auth.error) return auth.error;

  try {
    const body = await readJson(req);
    const demandaId = text(body?.demandaId);
    if (!demandaId) return fail(400, "Dados insuficientes para o cancelamento.");
    if (!emailMatches(auth.session, typeof body?.emailMercado === "string" ? body.emailMercado : null)) return forbiddenEmail();

    const demanda = await prisma.demanda.findUnique({ where: { id: demandaId }, include: { ofertas: { select: { statusEntrega: true } } } });
    // Pedido de outro mercado responde como "não existe".
    if (!demanda || demanda.emailMercado.toLowerCase() !== auth.session.email.toLowerCase()) return fail(404, "Pedido não encontrado.");

    if (demanda.status === "CANCELADA") return fail(400, "Este pedido já foi cancelado anteriormente.");
    if (demanda.status === "CONCLUIDA" || demanda.ofertas.some((oferta) => oferta.statusEntrega === "ENTREGUE")) {
      return fail(400, "Pedidos já entregues não podem ser cancelados. Entre em contato com o suporte.");
    }

    const diasPassados = diasUteisDesde(demanda.criadoEm);
    if (diasPassados > PRAZO_CANCELAMENTO_DIAS_UTEIS) {
      return fail(
        422,
        `O prazo para cancelamento expirou. Cancelamentos são permitidos em até ${PRAZO_CANCELAMENTO_DIAS_UTEIS} dias úteis após o pedido. Este pedido foi feito há ${diasPassados} dias úteis.`,
        { prazoExpirado: true, diasPassados, prazoMaximo: PRAZO_CANCELAMENTO_DIAS_UTEIS },
      );
    }

    await prisma.$transaction([
      prisma.oferta.updateMany({ where: { demandaId }, data: { status: "CANCELADA" } }),
      prisma.demanda.update({ where: { id: demandaId }, data: { status: "CANCELADA" } }),
    ]);

    return NextResponse.json({
      message: "Pedido cancelado com sucesso.",
      detalhes: `Cancelamento realizado dentro do prazo (${diasPassados} de ${PRAZO_CANCELAMENTO_DIAS_UTEIS} dias úteis).`,
      reembolso: "O reembolso, se aplicável, será processado em até 5 dias úteis.",
    });
  } catch (error) {
    return serverError("mercado.cancelar", error, "Erro interno ao processar o cancelamento.");
  }
}
