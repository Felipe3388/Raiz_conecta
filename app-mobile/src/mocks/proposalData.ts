import { nextDeliveryDays } from "@/lib/delivery/schedule";
import { buildLadder } from "@/lib/pricing/dispatch";
import { PROPOSAL_WINDOW_MINUTES } from "@/lib/produtor/proposals";
import type { Proposal, ProposalItem, ProposalStatus } from "@/types/proposal";

const MARKET_A = "Mercado Teste";
const MARKET_B = "Empório São José";
const MARKET_C = "Hortifruti Bom Preço";

const MINUTE_MS = 60 * 1000;

// Um produto de um pedido de exemplo. `marketPrice` é o que o mercado paga e `round` o degrau da escada em que o
// sistema o enviou (lib/pricing/dispatch): o app só recebe o preço fixo desse degrau e nunca o preço do mercado.
// `accepted` é o que o produtor já aceitou, nos pedidos aceitos (pode ser menos do que foi oferecido).
interface ItemSeed {
  produto: string;
  quantidade: number;
  unidade: string;
  marketPrice: number;
  round: number;
  accepted?: number;
}

interface OrderSeed {
  id: string;
  numero: number;
  mercado: string;
  // 0 = o próximo dia de entrega, 1 = o seguinte, 2 = o terceiro.
  dayIndex: number;
  status: ProposalStatus;
  // Há quantos minutos chegou e quantos faltam para o prazo acabar (negativo = já acabou).
  receivedMinutesAgo: number;
  minutesLeft: number;
  itens: ItemSeed[];
}

const item = (
  produto: string,
  quantidade: number,
  unidade: string,
  marketPrice: number,
  round: number,
  accepted?: number,
): ItemSeed => ({ produto, quantidade, unidade, marketPrice, round, accepted });

// Um mercado pode ter vários pedidos, cada um com um ou vários produtos. Cada pedido vale por
// PROPOSAL_WINDOW_MINUTES minutos a partir de quando chegou.
const SEEDS: OrderSeed[] = [
  // Aceitos: o que o produtor já se comprometeu a entregar. O Alface foi aceito pela metade do que o mercado pediu.
  {
    id: "pr-1041",
    numero: 1041,
    mercado: MARKET_A,
    dayIndex: 0,
    status: "ACEITA",
    receivedMinutesAgo: 180,
    minutesLeft: -150,
    itens: [item("Morango", 30, "kg", 14, 1, 30), item("Abacaxi", 40, "kg", 5, 1, 40)],
  },
  {
    id: "pr-2051",
    numero: 2051,
    mercado: MARKET_B,
    dayIndex: 0,
    status: "ACEITA",
    receivedMinutesAgo: 300,
    minutesLeft: -270,
    itens: [item("Tomate", 50, "kg", 4.5, 0, 50), item("Alface", 12, "kg", 8, 2, 8)],
  },
  {
    id: "pr-3061",
    numero: 3061,
    mercado: MARKET_C,
    dayIndex: 1,
    status: "ACEITA",
    receivedMinutesAgo: 600,
    minutesLeft: -570,
    itens: [item("Cenoura", 60, "kg", 4.5, 3, 60), item("Mandioca", 80, "kg", 3, 1, 80)],
  },
  // Pendentes: esperam resposta, cada uma com o seu prazo.
  {
    id: "pr-1042",
    numero: 1042,
    mercado: MARKET_A,
    dayIndex: 1,
    status: "PENDENTE",
    receivedMinutesAgo: 6,
    minutesLeft: PROPOSAL_WINDOW_MINUTES - 6,
    // A Laranja o produtor de exemplo não vende: ela não aparece para ele (ver onlyMyProducts).
    itens: [item("Banana", 40, "kg", 3.8, 0), item("Tomate", 30, "kg", 4.5, 0), item("Laranja", 60, "kg", 3, 0)],
  },
  {
    id: "pr-2052",
    numero: 2052,
    mercado: MARKET_B,
    dayIndex: 1,
    status: "PENDENTE",
    receivedMinutesAgo: 21,
    minutesLeft: PROPOSAL_WINDOW_MINUTES - 21,
    itens: [item("Cenoura", 40, "kg", 4.5, 4), item("Mandioca", 30, "kg", 3, 2), item("Morango", 20, "kg", 14, 1)],
  },
  {
    id: "pr-3062",
    numero: 3062,
    mercado: MARKET_C,
    dayIndex: 2,
    status: "PENDENTE",
    receivedMinutesAgo: 1,
    minutesLeft: PROPOSAL_WINDOW_MINUTES - 1,
    itens: [item("Alface", 12, "kg", 8, 0)],
  },
  // Encerrados: recusado pelo produtor e expirado sem resposta.
  {
    id: "pr-1043",
    numero: 1043,
    mercado: MARKET_A,
    dayIndex: 1,
    status: "RECUSADA",
    receivedMinutesAgo: 1500,
    minutesLeft: -1470,
    itens: [item("Tomate", 30, "kg", 4.5, 0)],
  },
  {
    id: "pr-2053",
    numero: 2053,
    mercado: MARKET_B,
    dayIndex: 1,
    status: "EXPIRADA",
    receivedMinutesAgo: 2000,
    minutesLeft: -1970,
    itens: [item("Mandioca", 50, "kg", 3, 0)],
  },
];

function toItems(order: OrderSeed): ProposalItem[] {
  return order.itens.map((entry, index) => ({
    id: `${order.id}-${index + 1}`,
    produto: entry.produto,
    quantidade: entry.quantidade,
    unidade: entry.unidade,
    preco: buildLadder(entry.marketPrice)[entry.round].price,
    aceita: order.status === "ACEITA" ? (entry.accepted ?? entry.quantidade) : order.status === "RECUSADA" ? 0 : null,
  }));
}

// Pedidos de exemplo, todos com preço e prazo definidos pelo sistema (o produtor não escolhe nenhum dos dois).
// Os dias de entrega são sempre terça ou sexta, a partir de hoje.
export function seedProposals(now: Date): Proposal[] {
  const days = nextDeliveryDays(now, 3);
  const at = (minutes: number) => new Date(now.getTime() + minutes * MINUTE_MS).toISOString();

  return SEEDS.map((order) => ({
    id: order.id,
    numero: order.numero,
    mercado: order.mercado,
    itens: toItems(order),
    entrega: days[order.dayIndex],
    status: order.status,
    recebidaEm: at(-order.receivedMinutesAgo),
    expiraEm: at(order.minutesLeft),
    respondidaEm: order.status === "ACEITA" || order.status === "RECUSADA" ? at(-order.receivedMinutesAgo + 5) : null,
  }));
}
