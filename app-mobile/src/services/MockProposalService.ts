import { quantitiesError, secondsLeft } from "@/lib/produtor/proposals";
import type { Proposal, ProposalResponse } from "@/types/proposal";
import { DEFAULT_MOCK_LATENCY_MS, wait } from "./mockLatency";
import type { ProposalGateway } from "./ProposalGateway";

interface MockProposalOptions {
  // Monta as propostas de exemplo a partir da hora atual (os prazos são relativos a ela).
  seed: (now: Date) => Proposal[];
  now?: () => Date;
  latencyMs?: number;
}

const clone = <T>(value: T): T => structuredClone(value);

// Propostas guardadas em memória, uma base por pessoa. O servidor de verdade decide a quem cada pedido vai;
// aqui as propostas já nascem endereçadas ao produtor que entrou.
export class MockProposalService implements ProposalGateway {
  private readonly seed: MockProposalOptions["seed"];
  private readonly now: () => Date;
  private readonly latencyMs: number;
  private readonly stores = new Map<string, Proposal[]>();

  constructor({ seed, now = () => new Date(), latencyMs = DEFAULT_MOCK_LATENCY_MS }: MockProposalOptions) {
    this.seed = seed;
    this.now = now;
    this.latencyMs = latencyMs;
  }

  async listProposals(email: string): Promise<Proposal[]> {
    await wait(this.latencyMs);
    return clone(this.store(email));
  }

  async respond(email: string, proposalId: string, response: ProposalResponse): Promise<Proposal> {
    await wait(this.latencyMs);
    const proposal = this.store(email).find((item) => item.id === proposalId);
    if (!proposal) throw new Error("Proposta não encontrada.");
    if (proposal.status !== "PENDENTE" && proposal.status !== "EXPIRADA") {
      throw new Error("Esta proposta já foi respondida.");
    }
    if (proposal.status === "EXPIRADA") throw new Error("O prazo para responder esta proposta acabou.");

    if (response.answer === "ACEITAR") {
      const error = quantitiesError(proposal, response.quantities);
      if (error) throw new Error(error);
    }

    for (const entry of proposal.itens) {
      entry.aceita = response.answer === "ACEITAR" ? (response.quantities[entry.id] ?? 0) : 0;
    }
    proposal.status = response.answer === "ACEITAR" ? "ACEITA" : "RECUSADA";
    proposal.respondidaEm = this.now().toISOString();
    return clone(proposal);
  }

  // A base é criada no primeiro contato com alguém. Antes de devolvê-la, o que passou do prazo vira expirado.
  private store(email: string): Proposal[] {
    const key = email.trim().toLowerCase();
    let proposals = this.stores.get(key);
    if (!proposals) {
      proposals = this.seed(this.now());
      this.stores.set(key, proposals);
    }

    const now = this.now();
    for (const proposal of proposals) {
      if (proposal.status === "PENDENTE" && secondsLeft(proposal, now) === 0) proposal.status = "EXPIRADA";
    }
    return proposals;
  }
}
