import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { writeFile } from "fs/promises";
import path from "path";

export async function POST(req: Request) {
    try {
        // Agora recebemos um FormData gigante em vez de um JSON simples
        const formData = await req.formData();

        // Extraindo os dados do Passo 1
        const tipoUsuario = formData.get("tipoUsuario") as string;
        const nome = formData.get("nome") as string;
        const email = formData.get("email") as string;
        const senha = formData.get("senha") as string;

        // Extraindo os dados do Passo 2
        const tipoDoc = formData.get("tipoDoc") as string;
        const documento = formData.get("documento") as string;
        const cep = formData.get("cep") as string;
        const rua = formData.get("rua") as string;
        const numero = formData.get("numero") as string;
        const bairro = formData.get("bairro") as string;
        const cidade = formData.get("cidade") as string;
        const estado = formData.get("estado") as string;
        const tipoComprovante = formData.get("tipoComprovante") as string;
        const file = formData.get("file") as File;

        if (!nome || !email || !senha || !tipoUsuario || !documento) {
            return NextResponse.json({ error: "Preencha todos os campos obrigatórios." }, { status: 400 });
        }

        // 1. Verifica se o e-mail já existe na tabela de Acesso
        const usuarioExistente = await prisma.acesso.findFirst({
            where: { login: email }
        });

        if (usuarioExistente) {
            return NextResponse.json({ error: "Este e-mail já está cadastrado." }, { status: 400 });
        }

        // 2. Lógica para salvar a imagem do documento fisicamente na pasta do projeto
        let urlDocumento = "";
        if (file) {
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);

            // Gera um nome único para o arquivo
            const nomeArquivo = `doc_${Date.now()}_${file.name.replace(/\s/g, '_')}`;
            const caminhoDestino = path.join(process.cwd(), "public/uploads/docs", nomeArquivo);

            // Salva o arquivo na pasta public/uploads/docs
            await writeFile(caminhoDestino, buffer);
            urlDocumento = `/uploads/docs/${nomeArquivo}`;
        }

        // 3. Criptografa a senha
        const hashSenha = await bcrypt.hash(senha, 10);

        // 4. Objeto base comum para Produtor ou Mercado
        const dadosComuns = {
            nomeFantasia: nome,
            email: email,
            status: "EM_ANALISE",
            // Campos logísticos e de validação (Ajuste caso seu schema Prisma tenha nomes diferentes)
            documento: documento,
            cep: cep,
            rua: rua,
            numero: numero,
            bairro: bairro,
            cidade: cidade,
            estado: estado,
            urlDocumento: urlDocumento,
            Acessos: {
                create: {
                    login: email,
                    hash: hashSenha,
                    tipoUser: tipoUsuario === "produtor" ? "produtor" : "mercado",
                    status: "EM_ANALISE"
                }
            }
        };

        // 5. Salva no Banco de Dados TUDO de uma vez
        if (tipoUsuario === "produtor") {
            await prisma.vendedor.create({ data: dadosComuns });
        } else {
            await prisma.cliente.create({ data: dadosComuns });
        }

        // 6. DISPARO DO E-MAIL VIA MICROSSERVIÇO
        try {
            await fetch("http://localhost:3001/api/email/boas-vindas", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, nome, tipoUsuario })
            });
        } catch (err) {
            console.error("Falha ao comunicar com o microsserviço de e-mail:", err);
        }

        return NextResponse.json({ message: "Cadastro realizado com sucesso!" }, { status: 201 });

    } catch (error) {
        console.error("Erro na API de Cadastro:", error);
        return NextResponse.json({ error: "Erro interno no servidor ao tentar cadastrar." }, { status: 500 });
    }
}