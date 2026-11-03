import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth/session";
import { fail, readJson, serverError } from "@/lib/api/http";
import { isValidDeviceId, normalizeDeviceId } from "@/lib/iot/deviceId";
import { releaseScale } from "@/lib/iot/links";
import { cleanScaleName } from "@/lib/iot/name";
import { toScaleLink } from "@/lib/iot/scales";

type Context = { params: Promise<{ id: string }> };

const NOT_FOUND = "Balança não encontrada.";

// A balança só existe para quem é dono dela: de outro produtor, responde "não encontrada" (404).
async function ownScale(email: string, rawId: string) {
  if (!isValidDeviceId(rawId)) return null;
  const balanca = await prisma.balanca.findUnique({ where: { deviceId: normalizeDeviceId(rawId) } });
  return balanca?.emailProdutor?.toLowerCase() === email.toLowerCase() ? balanca : null;
}

// PATCH { apelido }: o nome que o produtor deu à balança. Vazio volta ao nome de fábrica.
export async function PATCH(req: Request, { params }: Context) {
  const auth = await requireSession(req, ["produtor"]);
  if (auth.error) return auth.error;

  try {
    const body = await readJson(req);
    if (!body || !("apelido" in body) || (body.apelido !== null && typeof body.apelido !== "string")) {
      return fail(400, "Informe o novo nome da balança.");
    }
    const balanca = await ownScale(auth.session.email, (await params).id);
    if (!balanca) return fail(404, NOT_FOUND);

    const apelido = body.apelido === null ? null : cleanScaleName(body.apelido);
    await prisma.balanca.update({ where: { id: balanca.id }, data: { apelido } });
    return NextResponse.json(toScaleLink({ ...balanca, apelido }, auth.session.email));
  } catch (error) {
    return serverError("balancas.renomear", error, "Não foi possível renomear a balança.");
  }
}

// DELETE: tira a balança da conta. Ela volta a ficar livre e o histórico dela é apagado.
export async function DELETE(req: Request, { params }: Context) {
  const auth = await requireSession(req, ["produtor"]);
  if (auth.error) return auth.error;

  try {
    const balanca = await ownScale(auth.session.email, (await params).id);
    if (!balanca) return fail(404, NOT_FOUND);

    await prisma.$transaction((tx) => releaseScale(tx, balanca.id));
    return NextResponse.json({ message: "Balança removida." });
  } catch (error) {
    return serverError("balancas.remover", error, "Não foi possível remover a balança.");
  }
}
