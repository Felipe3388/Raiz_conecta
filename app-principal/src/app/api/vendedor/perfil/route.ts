/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// ROTA GET: Devolve os dados do produtor para montar a tela
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get("email");

        if (!email) return NextResponse.json({ error: "E-mail não fornecido" }, { status: 400 });

        const produtor = await prisma.vendedor.findFirst({
            where: { email },
        });

        return NextResponse.json(produtor);
    } catch (error) {
        return NextResponse.json({ error: "Erro ao buscar perfil" }, { status: 500 });
    }
}

// ROTA POST: Recebe a foto, salva no PC e atualiza o Banco de Dados
export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const email = formData.get("email") as string;
        const file = formData.get("file") as File;

        if (!email || !file) {
            return NextResponse.json({ error: "Dados ou arquivo faltando" }, { status: 400 });
        }

        // Transforma o arquivo em bytes para o Node conseguir salvar
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Cria um nome único para o arquivo usando o date now como id e depois o nome do arquivo original (limpando os espaços)
        const nomeUnico = `doc_${Date.now()}_${file.name.replaceAll(" ", "_")}`;

        // Define ONDE vai salvar que é na pasta "public/uploads/docs"
        const pastaUpload = path.join(process.cwd(), "public/uploads/docs");

        // Garante que a pasta existe (se não existir, cria automaticamente)
        await mkdir(pastaUpload, { recursive: true });

        const caminhoCompleto = path.join(pastaUpload, nomeUnico);

        // Salva o arquivo no seu computador
        await writeFile(caminhoCompleto, buffer);

        // O caminho que vai ficar salvo no banco de dados
        const urlParaSalvar = `/uploads/docs/${nomeUnico}`;

        // Atualiza o Produtor: Muda o status para "A_ANALISE" e cola a URL do documento
        await prisma.vendedor.updateMany({
            where: { email },
            data: {
                status: "A_ANALISE",
                urlDocumento: urlParaSalvar
            }
        });

        return NextResponse.json({ message: "Documento enviado com sucesso!" });

    } catch (error) {
        console.error("Erro no Upload:", error);
        return NextResponse.json({ error: "Erro interno ao processar arquivo" }, { status: 500 });
    }
}