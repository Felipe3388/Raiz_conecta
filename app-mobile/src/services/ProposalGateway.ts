import type { Proposal, ProposalResponse } from "@/types/proposal";

// Os pedidos que o sistema dispara para o produtor. O site ainda não tem nada disto: só existe a versão simulada
// (MockProposalService). No servidor, a escada de preço decide para quem cada pedido vai e por quanto (lib/pricing/dispatch);
// o app só recebe a proposta com o preço fixo de cada produto e responde.
export interface ProposalGateway {
  // Todas as propostas do produtor: as que esperam resposta, as aceitas e as encerradas.
  listProposals(email: string): Promise<Proposal[]>;
  // Recusa o pedido ou aceita a quantidade escolhida de cada produto (pode ser menos do que foi oferecido: o resto
  // segue para outros produtores). Devolve o pedido já atualizado.
  respond(email: string, proposalId: string, response: ProposalResponse): Promise<Proposal>;
}
