import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// BUSCAR os produtos que o produtor já marcou que vende
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) return NextResponse.json({ error: "E-mail não fornecido" }, { status: 400 });

    try {
        const vendedor = await prisma.vendedor.findUnique({
            where: { email },
            include: { Estoques: true } // Puxa os vínculos da tabela Prod_Vendedor_Possui
        });

        if (!vendedor) return NextResponse.json({ error: "Produtor não encontrado" }, { status: 404 });

        // Retorna apenas um array com os IDs dos produtos que ele marcou (ex: [1, 4, 5])
        const meusProdutosIds = vendedor.Estoques.map(e => e.cdProduto);
        return NextResponse.json(meusProdutosIds);
    } catch (error) {
        return NextResponse.json({ error: "Erro ao buscar produtos" }, { status: 500 });
    }
}

// SALVAR as escolhas do produtor (Sincronização)
export async function POST(req: Request) {
    try {
        const { email, produtosIds } = await req.json();

        const vendedor = await prisma.vendedor.findUnique({ where: { email } });
        if (!vendedor) return NextResponse.json({ error: "Produtor não encontrado" }, { status: 404 });

        // 1. Apaga todas as escolhas anteriores para não duplicar
        await prisma.prod_Vendedor_Possui.deleteMany({
            where: { cdVendedor: vendedor.cdVendedor }
        });

        // 2. Cria as novas escolhas baseadas no array recebido
        if (produtosIds && produtosIds.length > 0) {
            const novosVinculos = produtosIds.map((idProduto: number) => ({
                cdVendedor: vendedor.cdVendedor,
                cdProduto: idProduto,
                saldo: 0 // Valor padrão
            }));

            await prisma.prod_Vendedor_Possui.createMany({
                data: novosVinculos
            });
        }

        return NextResponse.json({ message: "Catálogo atualizado com sucesso!" });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Erro ao salvar catálogo" }, { status: 500 });
    }
}