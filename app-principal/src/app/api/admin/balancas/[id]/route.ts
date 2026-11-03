import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth/session";
import { fail, prismaCode, readJson, serverError } from "@/lib/api/http";
import { adminScale } from "@/lib/iot/admin";
import { isValidDeviceId, normalizeDeviceId } from "@/lib/iot/deviceId";
import { releaseScale } from "@/lib/iot/links";

type Context = { params: Promise<{ id: string }> };

// PATCH { liberar: true }: desvincula a balança do produtor (ele perdeu o acesso, vendeu a balança...).
export async function PATCH(req: Request, { params }: Context) {
  const auth = await requireSession(req, ["admin"]);
  if (auth.error) return auth.error;

  try {
    const body = await readJson(req);
    if (body?.liberar !== true) return fail(400, "Dados inválidos");
    const rawId = (await params).id;
    if (!isValidDeviceId(rawId)) return fail(404, "Balança não encontrada.");

    const balanca = await prisma.balanca.findUnique({ where: { deviceId: normalizeDeviceId(rawId) } });
    if (!balanca) return fail(404, "Balança não encontrada.");

    await prisma.$transaction((tx) => releaseScale(tx, balanca.id));
    return NextResponse.json(adminScale({ ...balanca, emailProdutor: null, apelido: null, conectada: false, vinculadaEm: null, ultimoKg: null }));
  } catch (error) {
    return serverError("admin.balancas.liberar", error, "Erro ao liberar a balança");
  }
}

// DELETE: tira a balança do sistema (e o histórico dela, em cascata).
export async function DELETE(req: Request, { params }: Context) {
  const auth = await requireSession(req, ["admin"]);
  if (auth.error) return auth.error;

  try {
    const rawId = (await params).id;
    if (!isValidDeviceId(rawId)) return fail(404, "Balança não encontrada.");
    await prisma.balanca.delete({ where: { deviceId: normalizeDeviceId(rawId) } });
    return NextResponse.json({ message: "Balança removida." });
  } catch (error) {
    if (prismaCode(error) === "P2025") return fail(404, "Balança não encontrada.");
    return serverError("admin.balancas.apagar", error, "Erro ao apagar a balança");
  }
}
