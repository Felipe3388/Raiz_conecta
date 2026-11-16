import { nextDeliveryDays } from "@/lib/delivery/schedule";
import type { ApiClient } from "@/lib/http/ApiClient";
import { quantitiesError } from "@/lib/produtor/proposals";
import type { Proposal, ProposalResponse } from "@/types/proposal";
import type { ProposalGateway } from "./ProposalGateway";

// Um item do mural, como GET /api/produtor/ofertas devolve (app-principal: lib/produtor/mural.ts).
// Cada item é UM produto de UM pedido de mercado, visível a todos os produtores que o têm no catálogo.
interface MuralItemDto {
  id: string;
  // Nome fantasia do mercado. Servidores mais antigos não mandam: aí vale MURAL_MARKET_NAME.
  mercado?: string;
  produto: string;
  quantidade: number;
  unidade: string;
  precoMedio: number;
  status: "ABERTA" | "CONCLUIDA";
  atendido: number;
  faltante: number;
  percentual: number;
  criadoEm: string;
  // Quanto este produtor garantiu (null = ainda não ofertou).
  minhaQuantidade: number | null;
}

interface MuralDto {
  // Pedidos abertos, de produtos do catálogo, que o produtor ainda não ofertou.
  mural: MuralItemDto[];
  // Pedidos em que o produtor já garantiu uma quantidade.
  minhas: MuralItemDto[];
}

// Nome usado quando o servidor não manda o nome do mercado (versão antiga do site ou mercado sem nome fantasia).
export const MURAL_MARKET_NAME = "Mercado da região";

// O servidor ainda não tem prazo de resposta: o pedido fica aberto até ser completado. O app, porém, conta um prazo
// a partir de `expiraEm`. Enquanto o servidor não tiver prazo, usamos uma janela longa a partir de agora, só para o
// pedido não expirar sozinho no aparelho.
export const OPEN_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

// Tudo é vendido por kg (1 unidade = 1 kg), qualquer que seja a unidade cadastrada na demanda (o padrão do site é "Caixas").
const SELL_UNIT = "kg";

// Número curto e estável para distinguir pedidos do mesmo mercado (o site só tem um id uuid).
export function orderNumber(id: string): number {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) % 9000;
  return 1000 + hash;
}

// Pedido do mural (ainda sem resposta): o que se oferece ao produtor é o que ainda falta para completar o pedido.
function toPendingProposal(item: MuralItemDto, now: Date): Proposal {
  return {
    id: item.id,
    numero: orderNumber(item.id),
    mercado: item.mercado?.trim() || MURAL_MARKET_NAME,
    itens: [
      {
        id: item.id,
        produto: item.produto,
        quantidade: item.faltante,
        unidade: SELL_UNIT,
        preco: item.precoMedio,
        aceita: null,
      },
    ],
    entrega: nextDeliveryDays(now, 1)[0],
    status: "PENDENTE",
    recebidaEm: item.criadoEm,
    expiraEm: new Date(now.getTime() + OPEN_WINDOW_MS).toISOString(),
    respondidaEm: null,
  };
}

// Pedido em que o produtor já garantiu uma quantidade: no site, oferta feita é oferta aceita.
function toAcceptedProposal(item: MuralItemDto, now: Date): Proposal {
  const accepted = item.minhaQuantidade ?? 0;
  const proposal = toPendingProposal(item, now);
  proposal.status = "ACEITA";
  proposal.itens[0].quantidade = Math.max(item.quantidade, accepted);
  proposal.itens[0].aceita = accepted;
  proposal.expiraEm = proposal.recebidaEm;
  return proposal;
}

// Propostas ligadas ao mural do site (/api/produtor/ofertas). O produtor vem do token, então o e-mail só serve de chave
// para as recusas locais. Limites do site que o app herda:
// - não há recusa no servidor: "Recusar" só esconde o pedido neste aparelho (e só até o app ser fechado);
// - o produtor responde uma vez por pedido ("Você já fez uma oferta"), com quantidade inteira até o que falta;
// - não há prazo nem dia de entrega: o dia é o próximo de terça ou sexta.
export class ApiProposalService implements ProposalGateway {
  // Recusas feitas neste aparelho: e-mail → (id do pedido → quando recusou).
  private readonly refused = new Map<string, Map<string, string>>();

  constructor(
    private readonly api: Pick<ApiClient, "get" | "post">,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async listProposals(email: string): Promise<Proposal[]> {
    const { mural, minhas } = await this.api.get<MuralDto>("/api/produtor/ofertas");
    const now = this.now();
    const refused = this.refusalsOf(email);

    const pending = mural
      .filter((item) => item.status === "ABERTA" && item.faltante > 0)
      .map((item) => {
        const proposal = toPendingProposal(item, now);
        const refusedAt = refused.get(item.id);
        if (refusedAt) {
          proposal.status = "RECUSADA";
          proposal.respondidaEm = refusedAt;
        }
        return proposal;
      });
    const accepted = minhas.filter((item) => item.minhaQuantidade !== null).map((item) => toAcceptedProposal(item, now));

    return [...pending, ...accepted];
  }

  async respond(email: string, proposalId: string, response: ProposalResponse): Promise<Proposal> {
    const proposal = (await this.listProposals(email)).find((item) => item.id === proposalId);
    if (!proposal) throw new Error("Proposta não encontrada.");
    if (proposal.status !== "PENDENTE") throw new Error("Esta proposta já foi respondida.");

    const answeredAt = this.now().toISOString();

    if (response.answer === "RECUSAR") {
      this.refusalsOf(email).set(proposalId, answeredAt);
      for (const entry of proposal.itens) entry.aceita = 0;
      return { ...proposal, status: "RECUSADA", respondidaEm: answeredAt };
    }

    const error = quantitiesError(proposal, response.quantities);
    if (error) throw new Error(error);

    // Um pedido do site tem um produto só, mas o contrato aceita vários: um POST por produto com quantidade.
    // Se o site recusar (já completaram, quantidade acima do que falta), o erro dele chega à tela como veio.
    for (const entry of proposal.itens) {
      const quantity = response.quantities[entry.id] ?? 0;
      if (quantity > 0) await this.api.post("/api/produtor/ofertas", { demandaId: entry.id, quantidade: quantity });
    }

    for (const entry of proposal.itens) entry.aceita = response.quantities[entry.id] ?? 0;
    return { ...proposal, status: "ACEITA", respondidaEm: answeredAt };
  }

  private refusalsOf(email: string): Map<string, string> {
    const key = email.trim().toLowerCase();
    let refusals = this.refused.get(key);
    if (!refusals) {
      refusals = new Map();
      this.refused.set(key, refusals);
    }
    return refusals;
  }
}
