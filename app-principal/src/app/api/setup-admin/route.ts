import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Verifica se já existe um admin no banco
    const adminExistente = await prisma.acesso.findFirst({
      where: { tipoUser: "admin" },
    });

    if (adminExistente) {
      return NextResponse.json({
        message: "O Admin já existe no banco de dados!",
        login: adminExistente.login,
      });
    }

    await prisma.acesso.create({
      data: {
        login: "admin@raizconecta.com.br", // email do admin
        hash: "Admin@123", // A senha do admin
        tipoUser: "admin",
        status: "APROVADO",
      },
    });

    return NextResponse.json({
      message:
        "✅ Super Admin criado com sucesso! Agora você pode fazer login pela tela normal.",
      login: "admin@raizconecta.com.br",
      senha: "Admin@123",
    });
  } catch (error) {
    console.error("Erro ao criar admin:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
