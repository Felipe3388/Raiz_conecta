import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile } from "fs/promises";
import path from "path";
import fs from "fs";

export async function POST(req: Request) {
    try {
        const formData = await req.formData();

        const email = formData.get("email") as string;
        const tipoUsuario = formData.get("tipoUsuario") as string;
        const tipoDoc = formData.get("tipoDoc") as string;
        const documento = formData.get("documento") as string;
        const cep = formData.get("cep") as string;
        const rua = formData.get("rua") as string;
        const numero = formData.get("numero") as string;
        const bairro = formData.get("bairro") as string;
        const cidade = formData.get("cidade") as string;
        const estado = formData.get("estado") as string;

        const file = formData.get("file") as File;

        if (!email || !tipoUsuario || !documento || !cep) {
            return NextResponse.json({ error: "Dados obrigatórios incompletos" }, { status: 400 });
        }

        let urlDocumentoReal = null;

        // Upload do Arquivo do anexo

        if (file && file.size > 0) {
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);

            // Pasta de destino (public/uploads/docs)
            const uploadDir = path.join(process.cwd(), "public", "uploads", "docs");

            // Se a pasta não existir, cria automaticamente
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            // Cria um nome único para o arquivo usando datenow como id e depois o nome do arquivo original (limpando espaços)
            const fileName = `doc_${Date.now()}_${file.name.replace(/\s/g, "_")}`;
            const filePath = path.join(uploadDir, fileName);

            // Salva o arquivo no seu computador
            await writeFile(filePath, buffer);

            // Cria o link limpo que será salvo no Banco de Dados
            urlDocumentoReal = `/uploads/docs/${fileName}`;
        }

        const dadosAtualizados = {
            tipoDoc,
            documento,
            cep,
            rua,
            numero,
            bairro,
            cidade,
            estado,
            status: "EM_ANALISE",
        };

        if (tipoUsuario === "produtor") {
            await prisma.vendedor.update({
                where: { email },
                data: {
                    ...dadosAtualizados,
                    // Só salva a URL no banco se o arquivo realmente existir
                    ...(urlDocumentoReal && { urlDocumento: urlDocumentoReal })
                }
            });
            await prisma.acesso.updateMany({
                where: { login: email },
                data: { status: "EM_ANALISE" }
            });

        } else if (tipoUsuario === "mercado") {
            await prisma.cliente.update({
                where: { email },
                data: {
                    ...dadosAtualizados,
                    ...(urlDocumentoReal && { urlDocumento: urlDocumentoReal })
                }
            });
            await prisma.acesso.updateMany({
                where: { login: email },
                data: { status: "EM_ANALISE" }
            });
        }

        return NextResponse.json({ message: "Perfil atualizado com sucesso!" }, { status: 200 });
    } catch (error) {
        console.error("Erro ao atualizar perfil:", error);
        return NextResponse.json({ error: "Erro interno ao salvar dados." }, { status: 500 });
    }
}