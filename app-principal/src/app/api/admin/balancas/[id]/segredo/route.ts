import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth/session";
import { fail, prismaCode, serverError } from "@/lib/api/http";
import { isValidDeviceId, normalizeDeviceId } from "@/lib/iot/deviceId";
import { generateSecret, hashSecret } from "@/lib/iot/secret";

// POST: gera um segredo novo para o módulo (o antigo para de valer na hora). Aparece uma vez, nesta resposta.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSession(req, ["admin"]);
  if (auth.error) return auth.error;

  try {
    const rawId = (await params).id;
    if (!isValidDeviceId(rawId)) return fail(404, "Balança não encontrada.");

    const segredo = generateSecret();
    await prisma.balanca.update({ where: { deviceId: normalizeDeviceId(rawId) }, data: { segredoHash: hashSecret(segredo) } });
    return NextResponse.json({ segredo });
  } catch (error) {
    if (prismaCode(error) === "P2025") return fail(404, "Balança não encontrada.");
    return serverError("admin.balancas.segredo", error, "Erro ao gerar o segredo");
  }
}
