// Situação de um pedido para este produtor. EXPIRADA: o prazo para responder acabou sem resposta.
export type ProposalStatus = "PENDENTE" | "ACEITA" | "RECUSADA" | "EXPIRADA";

// Um produto dentro do pedido de um mercado, com o preço fixo definido pela Raiz.
export interface ProposalItem {
  id: string;
  produto: string;
  // Quanto o mercado pediu e foi oferecido a este produtor. O produtor pode aceitar só uma parte: o resto do pedido
  // segue para outros produtores, até vários completarem o pedido.
  quantidade: number;
  unidade: string;
  // Preço fixo por unidade que o produtor receberá.
  preco: number;
  // Quanto o produtor aceitou entregar (0 até `quantidade`). null enquanto não respondeu.
  aceita: number | null;
}

// Um pedido de mercado enviado ao produtor. O sistema o dispara para um produtor por vez; quem recebe tem um prazo
// curto para escolher a quantidade de cada produto. O produtor não define o preço. Um mercado pode ter vários pedidos.
export interface Proposal {
  id: string;
  // Número do pedido, para o produtor distinguir pedidos do mesmo mercado.
  numero: number;
  mercado: string;
  itens: ProposalItem[];
  // Dia da entrega, no formato "2026-10-13" (terça ou sexta).
  entrega: string;
  status: ProposalStatus;
  // Quando o pedido chegou e até quando vale (data e hora completas).
  recebidaEm: string;
  expiraEm: string;
  respondidaEm: string | null;
}

// A resposta do produtor: recusar o pedido todo, ou aceitar quantidades (por id de item; 0 deixa o produto de fora).
export type ProposalResponse = { answer: "RECUSAR" } | { answer: "ACEITAR"; quantities: Record<string, number> };

export type ProposalAnswer = ProposalResponse["answer"];

// As quantidades que a pessoa vai escolhendo, por item.
export type ProposalQuantities = Record<string, number>;
