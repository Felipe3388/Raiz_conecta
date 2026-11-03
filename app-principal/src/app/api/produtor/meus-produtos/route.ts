import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseCatalogPayload } from "@/lib/catalogo/parseCatalogPayload";
import { planCatalogSync } from "@/lib/catalogo/planCatalogSync";
import { emailMatches, forbiddenEmail, requireSession } from "@/lib/auth/session";

// BUSCAR os produtos que o produtor já marcou que vende.
// Só o produtor logado lê o próprio catálogo; `?email=` ainda é aceito (apps antigos), mas precisa ser o da sessão.
// Com `?detalhes=1` devolve também o preço de cada produto: [{ cdProduto, preco }].
export async function GET(req: Request) {
    const auth = await requireSession(req, ["produtor"]);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);
    if (!emailMatches(auth.session, searchParams.get('email'))) return forbiddenEmail();
    const email = auth.session.email;
    const detalhes = searchParams.get('detalhes') === '1';

    try {
        const vendedor = await prisma.vendedor.findUnique({
            where: { email },
            include: { Estoques: true } // Puxa os vínculos da tabela Prod_Vendedor_Possui
        });

        if (!vendedor) return NextResponse.json({ error: "Produtor não encontrado" }, { status: 404 });

        if (detalhes) {
            return NextResponse.json(
                vendedor.Estoques.flatMap(e => e.cdProduto === null ? [] : [{ cdProduto: e.cdProduto, preco: e.preco ?? null }])
            );
        }

        // Retorna apenas um array com os IDs dos produtos que ele marcou (ex: [1, 4, 5])
        const meusProdutosIds = vendedor.Estoques.map(e => e.cdProduto);
        return NextResponse.json(meusProdutosIds);
    } catch {
        return NextResponse.json({ error: "Erro ao buscar produtos" }, { status: 500 });
    }
}

// SALVAR as escolhas do produtor (Sincronização)
// Corpo: { email, produtos: [{ cdProduto, preco? }] }
// Formato antigo ainda aceito: { email, produtosIds: [1, 4] }
export async function POST(req: Request) {
    const auth = await requireSession(req, ["produtor"]);
    if (auth.error) return auth.error;

    try {
        const body = await req.json().catch(() => null);

        const informado = typeof body === "object" && body !== null && "email" in body && typeof body.email === "string"
            ? body.email
            : null;
        if (!emailMatches(auth.session, informado)) return forbiddenEmail();
        const email = auth.session.email;

        const payload = parseCatalogPayload(body);
        if (!payload.ok) return NextResponse.json({ error: payload.error }, { status: 400 });

        const vendedor = await prisma.vendedor.findUnique({ where: { email } });
        if (!vendedor) return NextResponse.json({ error: "Produtor não encontrado" }, { status: 404 });

        // Todos os produtos enviados precisam existir no catálogo oficial
        const idsPedidos = payload.items.map(item => item.cdProduto);
        const encontrados = await prisma.produto.findMany({
            where: { cdProduto: { in: idsPedidos } },
            select: { cdProduto: true }
        });
        const idsEncontrados = new Set(encontrados.map(p => p.cdProduto));
        const inexistentes = idsPedidos.filter(id => !idsEncontrados.has(id));
        if (inexistentes.length > 0) {
            return NextResponse.json(
                { error: `Produto(s) não encontrado(s): ${inexistentes.join(", ")}.` },
                { status: 400 }
            );
        }

        // Sincroniza sem apagar tudo: quem continua no catálogo mantém o preço já definido
        const vinculosAtuais = await prisma.prod_Vendedor_Possui.findMany({
            where: { cdVendedor: vendedor.cdVendedor },
            select: { idRegistro: true, cdProduto: true, preco: true }
        });
        const plano = planCatalogSync(vinculosAtuais, payload.items, new Date());

        await prisma.$transaction([
            prisma.prod_Vendedor_Possui.deleteMany({
                where: { idRegistro: { in: plano.deleteIds } }
            }),
            prisma.prod_Vendedor_Possui.createMany({
                data: plano.create.map(vinculo => ({
                    ...vinculo,
                    cdVendedor: vendedor.cdVendedor,
                    saldo: 0 // Valor padrão
                }))
            }),
            ...plano.update.map(atualizacao =>
                prisma.prod_Vendedor_Possui.update({
                    where: { idRegistro: atualizacao.idRegistro },
                    data: { preco: atualizacao.preco, dtAtzPreco: atualizacao.dtAtzPreco }
                })
            )
        ]);

        return NextResponse.json({ message: "Catálogo atualizado com sucesso!" });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Erro ao salvar catálogo" }, { status: 500 });
    }
}
