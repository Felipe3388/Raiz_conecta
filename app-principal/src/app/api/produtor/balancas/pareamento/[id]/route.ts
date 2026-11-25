import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth/session";
import { fail, serverError } from "@/lib/api/http";
import { pairingStatus } from "@/lib/iot/pairing";

// GET: como está o pareamento aberto por este produtor. O app consulta a cada poucos segundos, já de volta à internet:
// `aguardando` (a balança ainda não falou com o servidor), `vinculada` (+ `pronta` quando ela já está enviando), `recusada`
// ou `expirada`.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSession(req, ["produtor"]);
  if (auth.error) return auth.error;
  const { email } = auth.session;

  try {
    const { id } = await params;
    const pareamento = await prisma.pareamentoBalanca.findUnique({ where: { id } });
    // Pareamento de outro produtor responde igual a um que não existe.
    if (!pareamento || pareamento.emailProdutor.toLowerCase() !== email.toLowerCase()) return fail(404, "Pareamento não encontrado.");

    const balanca = pareamento.usadoEm && pareamento.deviceId ? await prisma.balanca.findUnique({ where: { deviceId: pareamento.deviceId } }) : null;
    const response = NextResponse.json(pairingStatus(pareamento, balanca, email));
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    return serverError("balancas.pareamento.consultar", error, "Não foi possível consultar o pareamento.");
  }
}
