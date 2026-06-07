import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET =
  process.env.JWT_SECRET || "chave-secreta-super-segura-raiz-conecta"; // top descriçoes

export async function POST(req: Request) {
  try {
    const { email, senha } = await req.json();

    if (!email || !senha) {
      return NextResponse.json(
        { error: "E-mail e senha são obrigatórios." },
        { status: 400 },
      );
    }

    // 1. Busca o usuário
    const usuario = await prisma.acesso.findFirst({
      where: { login: email },
    });

    if (!usuario) {
      return NextResponse.json(
        { error: "E-mail ou senha incorretos." },
        { status: 401 },
      );
    }

    // 2. Compara as senhas
    const senhaValida = await bcrypt.compare(senha, usuario.hash || "");

    if (!senhaValida) {
      return NextResponse.json(
        { error: "E-mail ou senha incorretos." },
        { status: 401 },
      );
    }

    // 3. Bloqueia contas SUSPENSAS ou REJEITADAS
    if (usuario.status === "SUSPENSO" || usuario.status === "REJEITADO") {
      return NextResponse.json(
        {
          error:
            "Sua conta foi suspensa ou rejeitada. Entre em contato com o suporte.",
        },
        { status: 403 },
      );
    }

    // 4. Busca o nome de exibição conforme o tipo de usuário
    let nomeParaExibir = "Administrador";
    if (usuario.tipoUser === "produtor") {
      const produtor = await prisma.vendedor.findFirst({
        where: { email: email },
      });
      if (produtor) nomeParaExibir = produtor.nomeFantasia || produtor.email || email;
    } else if (usuario.tipoUser === "mercado") {
      const mercado = await prisma.cliente.findFirst({
        where: { email: email },
      });
      if (mercado) nomeParaExibir = mercado.nomeFantasia || mercado.email || email;
    }

    // 5. Gera o JWT com todos os dados necessários
    const token = jwt.sign(
      {
        email: email,
        role: usuario.tipoUser,
        nome: nomeParaExibir,
        status: usuario.status,
      },
      JWT_SECRET,
      { expiresIn: "2h" },
    );

    // 6. Monta a resposta
    const response = NextResponse.json(
      {
        message: "Login realizado com sucesso!",
        token: token,
        user: {
          email: email,
          tipoUser: usuario.tipoUser,
          nome: nomeParaExibir,
          status: usuario.status,
        },
      },
      { status: 200 },
    );

    // 7. Salva o token nos Cookies para o Middleware funcionar
    response.cookies.set("token", token, {
      path: "/",
      maxAge: 60 * 60 * 24, // 24 horas
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    console.error("Erro na API de Login:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor." },
      { status: 500 },
    );
  }
}
