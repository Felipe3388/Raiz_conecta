import { roundCents } from "@/lib/pricing/price";
import { includesText, normalizeText } from "@/lib/text/normalize";
import type { Proposal, ProposalAnswer, ProposalItem, ProposalQuantities, ProposalStatus } from "@/types/proposal";

export type ProposalFilter = "all" | "pending" | "accepted" | "closed";
export type ProposalSort = "priority" | "recent" | "valueDesc" | "nameAsc";

const time = (iso: string) => Date.parse(iso);

// Quanto tempo o produtor tem para responder um pedido. São 30 minutos porque o aviso ainda chega por e-mail; quando
// houver WhatsApp ou notificação no celular, o prazo pode encurtar. Quem aplica o prazo de verdade é o servidor; aqui
// ele serve para os dados de exemplo.
export const PROPOSAL_WINDOW_MINUTES = 30;

// Segundos que faltam para o prazo acabar (0 quando já acabou). Arredonda para cima: com 0,2 s ainda resta 1 s.
export function secondsLeft(proposal: Proposal, now: Date): number {
  return Math.max(0, Math.ceil((time(proposal.expiraEm) - now.getTime()) / 1000));
}

// "14:05"; passando de uma hora, "1h05".
export function countdownLabel(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const pad = (value: number) => String(value).padStart(2, "0");
  if (seconds >= 3600) return `${Math.floor(seconds / 3600)}h${pad(Math.floor((seconds % 3600) / 60))}`;
  return `${Math.floor(seconds / 60)}:${pad(seconds % 60)}`;
}

// Versão sem segundos, para telas que não se atualizam a cada segundo: "12 min", "menos de 1 min", "1h05".
export function minutesLabel(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  if (seconds >= 3600) return countdownLabel(seconds);
  if (seconds < 60) return "menos de 1 min";
  return `${Math.ceil(seconds / 60)} min`;
}

// A situação que vale agora: a pendente que passou do prazo já está expirada, mesmo que a lista ainda não tenha recarregado.
export function effectiveStatus(proposal: Proposal, now: Date): ProposalStatus {
  return proposal.status === "PENDENTE" && secondsLeft(proposal, now) === 0 ? "EXPIRADA" : proposal.status;
}

export function canAnswer(proposal: Proposal, now: Date): boolean {
  return effectiveStatus(proposal, now) === "PENDENTE";
}

const STATUS_BY_ANSWER: Record<ProposalAnswer, ProposalStatus> = { ACEITAR: "ACEITA", RECUSAR: "RECUSADA" };

export function answeredStatus(answer: ProposalAnswer): ProposalStatus {
  return STATUS_BY_ANSWER[answer];
}

export const itemTotal = (item: ProposalItem): number => roundCents(item.quantidade * item.preco);

// Valor do pedido inteiro, com tudo o que foi oferecido ao produtor.
export function proposalTotal(proposal: Proposal): number {
  return roundCents(proposal.itens.reduce((sum, item) => sum + item.quantidade * item.preco, 0));
}

// O que o produtor aceitou entregar de cada produto (os que ficaram com 0 não entram).
export function acceptedItems(proposal: Proposal): ProposalItem[] {
  return proposal.itens.filter((item) => (item.aceita ?? 0) > 0);
}

// Valor do que foi aceito, a receita do produtor neste pedido.
export function acceptedTotal(proposal: Proposal): number {
  return roundCents(proposal.itens.reduce((sum, item) => sum + (item.aceita ?? 0) * item.preco, 0));
}

// Valor das quantidades que a pessoa está escolhendo.
export function selectionTotal(proposal: Proposal, quantities: ProposalQuantities): number {
  return roundCents(proposal.itens.reduce((sum, item) => sum + (quantities[item.id] ?? 0) * item.preco, 0));
}

// Quantos produtos têm alguma quantidade escolhida.
export function selectedCount(proposal: Proposal, quantities: ProposalQuantities): number {
  return proposal.itens.filter((item) => (quantities[item.id] ?? 0) > 0).length;
}

// Escolheu menos do que foi oferecido: o resto do pedido segue para outros produtores.
export function isPartial(proposal: Proposal, quantities: ProposalQuantities): boolean {
  return proposal.itens.some((item) => (quantities[item.id] ?? 0) < item.quantidade);
}

// Quantidades escolhidas para aceitar: inteiras, de 0 até o que foi oferecido, e ao menos um produto.
export function quantitiesError(proposal: Proposal, quantities: ProposalQuantities): string | null {
  const known = new Set(proposal.itens.map((item) => item.id));
  if (Object.keys(quantities).some((id) => !known.has(id))) return "Há um produto que não faz parte deste pedido.";

  for (const item of proposal.itens) {
    const chosen = quantities[item.id] ?? 0;
    if (!Number.isInteger(chosen) || chosen < 0 || chosen > item.quantidade) {
      return `A quantidade de ${item.produto} deve ir de 0 a ${item.quantidade}.`;
    }
  }
  return selectedCount(proposal, quantities) === 0 ? "Escolha a quantidade de pelo menos um produto." : null;
}

// Todas as quantidades oferecidas, por produto: é o que "Aceitar tudo" escolhe.
export function fullQuantities(proposal: Proposal): ProposalQuantities {
  return Object.fromEntries(proposal.itens.map((item) => [item.id, item.quantidade]));
}

// Os produtos do pedido em uma frase curta: "Morango", "Morango e Abacaxi", "Morango, Abacaxi e Alface".
export function itemsSummary(proposal: Proposal): string {
  const names = proposal.itens.map((item) => item.produto);
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} e ${names[names.length - 1]}`;
}

// Um mercado, com os pedidos dele que aparecem na lista.
export interface MarketGroup {
  key: string;
  mercado: string;
  orders: Proposal[];
}

// A chave de um mercado: o nome sem acento nem maiúsculas.
export const marketKey = (mercado: string): string => normalizeText(mercado);

// Junta os pedidos do mesmo mercado, na ordem em que cada mercado aparece primeiro (a lista já vem ordenada).
export function groupByMarket(proposals: Proposal[]): MarketGroup[] {
  const groups = new Map<string, MarketGroup>();
  for (const proposal of proposals) {
    const key = marketKey(proposal.mercado);
    const group = groups.get(key) ?? { key, mercado: proposal.mercado, orders: [] };
    group.orders.push(proposal);
    groups.set(key, group);
  }
  return [...groups.values()];
}

// Cada filtro é uma regra sobre a situação que vale agora. "Todas" não filtra.
const FILTER_RULES: Record<ProposalFilter, (status: ProposalStatus) => boolean> = {
  all: () => true,
  pending: (status) => status === "PENDENTE",
  accepted: (status) => status === "ACEITA",
  closed: (status) => status === "RECUSADA" || status === "EXPIRADA",
};

export function filterProposals(proposals: Proposal[], filter: ProposalFilter, now: Date): Proposal[] {
  return proposals.filter((proposal) => FILTER_RULES[filter](effectiveStatus(proposal, now)));
}

export function proposalCounts(proposals: Proposal[], now: Date): Record<ProposalFilter, number> {
  return {
    all: proposals.length,
    pending: filterProposals(proposals, "pending", now).length,
    accepted: filterProposals(proposals, "accepted", now).length,
    closed: filterProposals(proposals, "closed", now).length,
  };
}

// O produtor só vê, em cada pedido, os produtos que ele vende (os do catálogo dele). Um mercado que pediu 3 produtos
// aparece com 1 só, se esse é o único que o produtor vende; o pedido que não tem nenhum dos produtos dele some.
// O que o produtor já aceitou continua na lista, mesmo que ele tenha tirado o produto do catálogo depois, porque é um
// compromisso de entrega. É o servidor que decide a quem cada pedido vai; esta regra deixa o app coerente com o catálogo.
export function onlyMyProducts(proposals: Proposal[], productNames: string[]): Proposal[] {
  const sold = new Set(productNames.map(normalizeText));
  return proposals.flatMap((proposal) => {
    const itens = proposal.itens.filter((item) => sold.has(normalizeText(item.produto)) || (item.aceita ?? 0) > 0);
    if (itens.length === 0) return [];
    return [itens.length === proposal.itens.length ? proposal : { ...proposal, itens }];
  });
}

// Busca por um dos produtos do pedido, pelo mercado ou pelo número do pedido.
export function searchProposals(proposals: Proposal[], query: string): Proposal[] {
  return proposals.filter(
    (proposal) =>
      includesText(proposal.mercado, query) ||
      includesText(String(proposal.numero), query) ||
      proposal.itens.some((item) => includesText(item.produto, query)),
  );
}

const newest = (a: Proposal, b: Proposal) => time(b.recebidaEm) - time(a.recebidaEm);
const byMarket = (a: Proposal, b: Proposal) => {
  const left = normalizeText(a.mercado);
  const right = normalizeText(b.mercado);
  return left < right ? -1 : left > right ? 1 : a.numero - b.numero;
};

// Prioridade: o que pede resposta vem primeiro (o prazo mais curto no topo), depois o que está planejado para
// entregar (a entrega mais próxima), e por fim o que já se encerrou (o mais recente primeiro).
const PRIORITY_GROUP: Record<ProposalStatus, number> = { PENDENTE: 0, ACEITA: 1, RECUSADA: 2, EXPIRADA: 2 };

function priority(now: Date) {
  return (a: Proposal, b: Proposal) => {
    const groupA = PRIORITY_GROUP[effectiveStatus(a, now)];
    const groupB = PRIORITY_GROUP[effectiveStatus(b, now)];
    if (groupA !== groupB) return groupA - groupB;
    if (groupA === 0) return time(a.expiraEm) - time(b.expiraEm);
    if (groupA === 1) return a.entrega < b.entrega ? -1 : a.entrega > b.entrega ? 1 : newest(a, b);
    return newest(a, b);
  };
}

export function sortProposals(proposals: Proposal[], sort: ProposalSort, now: Date): Proposal[] {
  const order: Record<ProposalSort, (a: Proposal, b: Proposal) => number> = {
    priority: priority(now),
    recent: newest,
    valueDesc: (a, b) => proposalTotal(b) - proposalTotal(a),
    nameAsc: byMarket,
  };
  return [...proposals].sort(order[sort]);
}
