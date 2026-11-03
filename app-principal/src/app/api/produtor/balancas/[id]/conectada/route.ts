import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth/session";
import { fail, serverError } from "@/lib/api/http";
import { isValidDeviceId, normalizeDeviceId } from "@/lib/iot/deviceId";
import { activateScale } from "@/lib/iot/links";

// PUT: passa a usar esta balança (a que a pesagem lê). As outras do produtor ficam desconectadas.
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSession(req, ["produtor"]);
  if (auth.error) return auth.error;

  try {
    const rawId = (await params).id;
    if (!isValidDeviceId(rawId)) return fail(404, "Balança não encontrada.");

    const found = await prisma.$transaction((tx) => activateScale(tx, auth.session.email, normalizeDeviceId(rawId)));
    if (!found) return fail(404, "Balança não encontrada.");
    return NextResponse.json({ message: "Balança conectada." });
  } catch (error) {
    return serverError("balancas.conectar", error, "Não foi possível trocar a balança.");
  }
}
