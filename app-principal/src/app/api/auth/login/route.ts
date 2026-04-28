import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    try {
        const { email, senha } = await req.json();

        // Procura o usuário no banco pelo e-mail (tabela de Acessos)
        const usuario = await prisma.acesso.findFirst({
            where: { login: email }
        });

        if (!usuario) {
            return NextResponse.json({ error: "E-mail não encontrado." }, { status: 404 });
        }

        // Verifica se a senha digitada bate com a criptografada no banco
        const senhaValida = await bcrypt.compare(senha, usuario.hash || "");

        if (!senhaValida) {
            return NextResponse.json({ error: "Senha incorreta." }, { status: 401 });
        }

        // Responde com sucesso e o tipo de usuário
        return NextResponse.json({
            message: "Login realizado com sucesso!",
            tipoUser: usuario.tipoUser
        }, { status: 200 });

    } catch (error) {
        console.error("Erro na API de Login:", error);
        return NextResponse.json({ error: "Erro interno no servidor." }, { status: 500 });
    }
}