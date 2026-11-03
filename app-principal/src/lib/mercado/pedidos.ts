// Regras dos pedidos do mercado (cotações): carrinho, prazo de cancelamento e como o pedido é mostrado ao mercado.

export const PRAZO_CANCELAMENTO_DIAS_UTEIS = 7;
export const MAX_ITENS_POR_COTACAO = 50;
export const MAX_QUANTIDADE_POR_ITEM = 100_000;

// Dias úteis (segunda a sexta) entre a criação do pedido e hoje. O dia do pedido não conta; cada dia útil depois dele conta 1.
export function diasUteisDesde(criadoEm: Date, agora: Date = new Date()): number {
  const cursor = new Date(Date.UTC(criadoEm.getUTCFullYear(), criadoEm.getUTCMonth(), criadoEm.getUTCDate()));
  const fim = Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth(), agora.getUTCDate());
  let dias = 0;
  while (cursor.getTime() < fim) {
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    const diaDaSemana = cursor.getUTCDay();
    if (diaDaSemana !== 0 && diaDaSemana !== 6) dias++;
  }
  return dias;
}

export function dentroDoPrazoDeCancelamento(criadoEm: Date, agora: Date = new Date()): boolean {
  return diasUteisDesde(criadoEm, agora) <= PRAZO_CANCELAMENTO_DIAS_UTEIS;
}

// A regra de "posso cancelar este pedido?", igual à do servidor: aberto, nada entregue e dentro do prazo.
// A tela usa para mostrar ou esconder o botão; quem decide de verdade é a rota.
export function podeCancelar(
  pedido: { status: string; criadoEm: Date | string; ofertas: { statusEntrega: string }[] },
  agora: Date = new Date(),
): boolean {
  if (pedido.status === "CANCELADA" || pedido.status === "CONCLUIDA") return false;
  if (pedido.ofertas.some((oferta) => oferta.statusEntrega === "ENTREGUE")) return false;
  return dentroDoPrazoDeCancelamento(new Date(pedido.criadoEm), agora);
}

export interface ItemDoCarrinho {
  // Código do produto no catálogo. O nome, a unidade e o preço de referência vêm do catálogo, não da tela.
  id: number;
  qtd: number;
}

// Confere o carrinho que a tela mandou. Junta itens repetidos do mesmo produto. Devolve a mensagem do que está errado.
export function parseCarrinho(raw: unknown): { ok: true; itens: ItemDoCarrinho[] } | { ok: false; error: string } {
  if (!Array.isArray(raw) || raw.length === 0) return { ok: false, error: "Dados inválidos ou carrinho vazio" };
  if (raw.length > MAX_ITENS_POR_COTACAO) return { ok: false, error: `Uma cotação aceita até ${MAX_ITENS_POR_COTACAO} produtos.` };

  const porProduto = new Map<number, number>();
  for (const item of raw) {
    const id = Number((item as { id?: unknown })?.id);
    const qtd = Number((item as { qtd?: unknown })?.qtd);
    if (!Number.isInteger(id) || id <= 0) return { ok: false, error: "Há um produto inválido no carrinho." };
    if (!Number.isInteger(qtd) || qtd < 1 || qtd > MAX_QUANTIDADE_POR_ITEM) {
      return { ok: false, error: `Use uma quantidade inteira entre 1 e ${MAX_QUANTIDADE_POR_ITEM.toLocaleString("pt-BR")}.` };
    }
    porProduto.set(id, Math.min((porProduto.get(id) ?? 0) + qtd, MAX_QUANTIDADE_POR_ITEM));
  }
  return { ok: true, itens: [...porProduto].map(([id, qtd]) => ({ id, qtd })) };
}

export interface DemandaDoMercado {
  id: string;
  produto: string;
  quantidade: number;
  unidade: string;
  precoMedio: number | null;
  status: string;
  criadoEm: Date | string;
  ofertas: { id: string; quantidade: number; emailProdutor: string; status: string; statusEntrega: string; nota: number | null }[];
}

// O pedido como o mercado o vê: as ofertas trazem o NOME do produtor, nunca o e-mail dele.
export function toPedido(demanda: DemandaDoMercado, nomes: Map<string, string>) {
  const ofertas = demanda.ofertas
    .filter((oferta) => oferta.status !== "CANCELADA")
    .map((oferta) => ({
      id: oferta.id,
      quantidade: oferta.quantidade,
      status: oferta.status,
      statusEntrega: oferta.statusEntrega,
      nota: oferta.nota,
      produtor: nomes.get(oferta.emailProdutor.toLowerCase()) ?? "Produtor",
    }));
  const garantido = ofertas.reduce((total, oferta) => total + oferta.quantidade, 0);
  return {
    id: demanda.id,
    produto: demanda.produto,
    quantidade: demanda.quantidade,
    unidade: demanda.unidade,
    precoMedio: demanda.precoMedio ?? 0,
    status: demanda.status,
    criadoEm: new Date(demanda.criadoEm).toISOString(),
    garantido,
    percentual: demanda.quantidade > 0 ? Math.min(Math.round((garantido / demanda.quantidade) * 100), 100) : 0,
    ofertas,
  };
}

export type Pedido = ReturnType<typeof toPedido>;
