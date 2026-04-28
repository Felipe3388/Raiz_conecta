/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// BUSCAR DADOS DO USUÁRIO
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email)
      return NextResponse.json(
        { error: "Email não informado" },
        { status: 400 },
      );

    // Pegao o usuário pela tabela de Acesso
    const acesso = await prisma.acesso.findFirst({ where: { login: email } });
    if (!acesso)
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 },
      );

    let dadosUsuario;
    if (acesso.tipoUser === "produtor" || acesso.cdVendedor) {
      dadosUsuario = await prisma.vendedor.findUnique({ where: { email } });
    } else {
      dadosUsuario = await prisma.cliente.findUnique({ where: { email } });
    }

    return NextResponse.json({ ...dadosUsuario, tipoUser: acesso.tipoUser });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao buscar dados" },
      { status: 500 },
    );
  }
}

// ATUALIZAR DADOS E SENHA
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const {
      email,
      tipoUser,
      nomeFantasia,
      telefone,
      cep,
      rua,
      numero,
      bairro,
      cidade,
      estado,
      novaSenha,
    } = body;

    const dadosAtualizados: any = {
      nomeFantasia,
      telefone,
      cep,
      rua,
      numero,
      bairro,
      cidade,
      estado,
    };

    // Se o usuário digitou uma senha nova, atualiza ela também
    if (novaSenha && novaSenha.trim() !== "") {
      dadosAtualizados.senha = novaSenha;
      // Atualiza a tabela de acesso que gerencia o login
      await prisma.acesso.updateMany({
        where: { login: email },
        data: { hash: novaSenha },
      });
    }

    // Salva na tabela correta
    if (tipoUser === "produtor") {
      await prisma.vendedor.update({
        where: { email },
        data: dadosAtualizados,
      });
    } else {
      await prisma.cliente.update({ where: { email }, data: dadosAtualizados });
    }

    return NextResponse.json(
      { message: "Perfil atualizado com sucesso!" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
    return NextResponse.json(
      { error: "Erro interno ao atualizar perfil" },
      { status: 500 },
    );
  }
}

// EXCLUIR CONTA 
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email)
      return NextResponse.json(
        { error: "Email não informado" },
        { status: 400 },
      );

    const acesso = await prisma.acesso.findFirst({ where: { login: email } });
    if (!acesso)
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 },
      );

    // Exclui o perfil dependendo de quem é
    if (acesso.tipoUser === "produtor" || acesso.cdVendedor) {
      await prisma.vendedor.delete({ where: { email } });
    } else {
      await prisma.cliente.delete({ where: { email } });
    }

    // Exclui o login do sistema
    await prisma.acesso.deleteMany({ where: { login: email } });

    return NextResponse.json(
      { message: "Conta excluída com sucesso!" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Erro ao excluir conta:", error);
    return NextResponse.json(
      {
        error: "Erro interno. Verifique se há pedidos vinculados a esta conta.",
      },
      { status: 500 },
    );
  }
}
