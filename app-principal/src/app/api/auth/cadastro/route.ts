import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    try {
        // Pega os dados do Front
        const { tipoUsuario, nome, email, senha } = await req.json();

        if (!nome || !email || !senha || !tipoUsuario) {
            return NextResponse.json({ error: "Preencha todos os campos obrigatórios." }, { status: 400 });
        }

        // Verifica se o e-mail já existe na tabela de Acesso
        const usuarioExistente = await prisma.acesso.findFirst({
            where: { login: email }
        });

        if (usuarioExistente) {
            return NextResponse.json({ error: "Este e-mail já está cadastrado." }, { status: 400 });
        }

        // Criptografa a senha
        const hashSenha = await bcrypt.hash(senha, 10);

        // Salva no Banco de Dados *PostgreSQL gera os IDs automaticamente
        if (tipoUsuario === "produtor") {
            await prisma.vendedor.create({
                data: {
                    nomeFantasia: nome,
                    email: email,
                    status: "EM_ANALISE",
                    Acessos: {
                        create: {
                            login: email,
                            hash: hashSenha,
                            tipoUser: "produtor",
                            status: "EM_ANALISE"
                        }
                    }
                }
            });
        } else {
            // Mercado também entra como EM_ANALISE para o Admin aprovar
            await prisma.cliente.create({
                data: {
                    nomeFantasia: nome,
                    email: email,
                    status: "EM_ANALISE",
                    Acessos: {
                        create: {
                            login: email,
                            hash: hashSenha,
                            tipoUser: "mercado",
                            status: "EM_ANALISE"
                        }
                    }
                }
            });
        }

        // DISPARO DO E-MAIL VIA MICROSSERVIÇO
        try {
            await fetch("http://localhost:3001/api/email/boas-vindas", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, nome, tipoUsuario })
            });
            console.log("Aviso de disparo de e-mail enviado ao Microsserviço!");
        } catch (err) {
            console.error("Falha ao comunicar com o microsserviço de e-mail:", err);
        }

        return NextResponse.json({ message: "Cadastro realizado com sucesso!" }, { status: 201 });

    } catch (error) {
        console.error("Erro na API de Cadastro:", error);
        return NextResponse.json({ error: "Erro interno no servidor ao tentar cadastrar." }, { status: 500 });
    }
}