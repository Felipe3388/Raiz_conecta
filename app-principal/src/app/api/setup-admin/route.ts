import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

/**
 * Rota de setup inicial — cria o primeiro admin do sistema.
 * ATENÇÃO: remova ou proteja esta rota em produção após o primeiro uso.
 * GET /api/setup-admin
 */
export async function GET() {
  try {
    // Verifica se já existe um admin
    const adminExistente = await prisma.acesso.findFirst({
      where: { tipoUser: "admin" },
    });

    if (adminExistente) {
      return NextResponse.json({
        message: "O Admin já existe no banco de dados.",
        login: adminExistente.login,
      });
    }

    const senhaAdmin = process.env.ADMIN_SENHA_INICIAL || "Admin@123";
    const hashSenha = await bcrypt.hash(senhaAdmin, 10);

    await prisma.acesso.create({
      data: {
        login: "admin@raizconecta.com.br",
        hash: hashSenha,
        tipoUser: "admin",
        status: "APROVADO",
      },
    });

    return NextResponse.json({
      message:
        "✅ Admin criado com sucesso! Faça login e depois remova esta rota.",
      login: "admin@raizconecta.com.br",
      aviso:
        "Defina ADMIN_SENHA_INICIAL nas variáveis de ambiente do Vercel antes de usar.",
    });
  } catch (error) {
    console.error("Erro ao criar admin:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
