import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET =
  process.env.JWT_SECRET || "chave-secreta-super-segura-raiz-conecta";

export async function POST(req: Request) {
  try {
    // 1. O SEGURANÇA DA PORTA: Verifica se o token JWT foi enviado no cabeçalho
    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Acesso negado. Token não fornecido." },
        { status: 401 },
      );
    }

    const token = authHeader.split(" ")[1];

    // 2. VERIFICAÇÃO DO CRACHÁ: Lê o token e vê se é válido e se é de um Admin
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        email: string;
        role: string;
      };

      // Se quem estiver tentando criar a conta não for admin, toma bloqueio!
      if (decoded.role !== "admin") {
        return NextResponse.json(
          {
            error:
              "Operação não autorizada. Apenas administradores podem criar outros admins.",
          },
          { status: 403 },
        );
      }
    } catch (err) {
      return NextResponse.json(
        { error: "Token inválido ou expirado. Faça login novamente." },
        { status: 401 },
      );
    }

    // 3. RECEBE OS DADOS DO NOVO ADMIN
    const { email, senha } = await req.json();

    if (!email || !senha) {
      return NextResponse.json(
        { error: "E-mail e senha são obrigatórios." },
        { status: 400 },
      );
    }

    // 4. VERIFICA SE O E-MAIL JÁ EXISTE NO BANCO
    const usuarioExistente = await prisma.acesso.findFirst({
      where: { login: email },
    });

    if (usuarioExistente) {
      return NextResponse.json(
        { error: "Este e-mail já está em uso no sistema." },
        { status: 400 },
      );
    }

    // 5. CRIPTOGRAFA A SENHA DO NOVO ADMIN E SALVA NO BANCO
    const hashSenha = await bcrypt.hash(senha, 10);

    await prisma.acesso.create({
      data: {
        login: email,
        hash: hashSenha,
        tipoUser: "admin",
        status: "APROVADO", // Admin já nasce aprovado
      },
    });

    return NextResponse.json(
      { message: "Novo administrador criado com sucesso!" },
      { status: 201 },
    );
  } catch (error) {
    console.error("Erro ao criar novo admin:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor." },
      { status: 500 },
    );
  }
}
