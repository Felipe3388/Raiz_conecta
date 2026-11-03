import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fail, serverError } from "@/lib/api/http";
import { isValidPassword } from "@/lib/validation/auth";

// Cria o PRIMEIRO administrador (GET /api/setup-admin), uma vez só. Precisa de ADMIN_SENHA_INICIAL nas variáveis de
// ambiente: antes havia uma senha padrão pública, o que deixava o primeiro a chegar ao endereço virar administrador.
export async function GET() {
  try {
    const existente = await prisma.acesso.findFirst({ where: { tipoUser: "admin" }, select: { login: true } });
    if (existente) return NextResponse.json({ message: "O Admin já existe no banco de dados.", login: existente.login });

    const senha = process.env.ADMIN_SENHA_INICIAL;
    if (!senha || !isValidPassword(senha)) {
      return fail(503, "Defina ADMIN_SENHA_INICIAL (mín. 8 caracteres, maiúscula, minúscula, número e símbolo) nas variáveis de ambiente e tente de novo.");
    }

    const login = "admin@raizconecta.com.br";
    await prisma.acesso.create({ data: { login, hash: await bcrypt.hash(senha, 10), tipoUser: "admin", status: "APROVADO" } });

    return NextResponse.json({
      message: "Admin criado com sucesso! Entre com a senha de ADMIN_SENHA_INICIAL e depois remova esta variável.",
      login,
    });
  } catch (error) {
    return serverError("admin.setup.falhou", error);
  }
}
