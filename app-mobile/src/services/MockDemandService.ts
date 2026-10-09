import { canOffer, findOffer, remainingQuantity } from "@/lib/produtor/demands";
import type { CancelOfferRequest, Demand, OfferRequest } from "@/types/produtor";
import type { DemandGateway } from "./DemandGateway";
import { DEFAULT_MOCK_LATENCY_MS, wait } from "./mockLatency";

interface MockDemandOptions {
  // Monta os pedidos de exemplo a partir do e-mail de quem está vendo a lista.
  seed: (viewerEmail: string) => Demand[];
  latencyMs?: number;
}

const clone = (demands: Demand[]): Demand[] => structuredClone(demands);

// Pedidos guardados em memória: ofertas feitas durante o uso aparecem nas listas, como na API real.
export class MockDemandService implements DemandGateway {
  private demands: Demand[] | null = null;
  private seededFor: string | null = null;
  private readonly seed: MockDemandOptions["seed"];
  private readonly latencyMs: number;

  constructor({ seed, latencyMs = DEFAULT_MOCK_LATENCY_MS }: MockDemandOptions) {
    this.seed = seed;
    this.latencyMs = latencyMs;
  }

  async listDemands(viewerEmail: string): Promise<Demand[]> {
    await wait(this.latencyMs);
    return clone(this.store(viewerEmail));
  }

  async sendOffer({ demandaId, quantidade, emailProdutor, preco }: OfferRequest): Promise<void> {
    await wait(this.latencyMs);

    const demand = this.store(emailProdutor).find((item) => item.id === demandaId);
    if (!demand) throw new Error("Demanda não encontrada.");
    if (demand.status !== "ABERTA") throw new Error("Esta demanda não está mais aberta.");
    if (findOffer(demand, emailProdutor)) {
      throw new Error("Você já fez uma oferta para esta demanda.");
    }
    if (!Number.isInteger(quantidade) || quantidade <= 0) {
      throw new Error("Informe uma quantidade válida.");
    }
    if (!canOffer(quantidade, remainingQuantity(demand))) {
      throw new Error("A quantidade é maior do que falta para completar o pedido.");
    }

    demand.ofertas.push(preco === undefined ? { quantidade, emailProdutor } : { quantidade, emailProdutor, preco });
    if (remainingQuantity(demand) === 0) demand.status = "CONCLUIDA";
  }

  async cancelOffer({ demandaId, emailProdutor }: CancelOfferRequest): Promise<void> {
    await wait(this.latencyMs);

    const demand = this.store(emailProdutor).find((item) => item.id === demandaId);
    if (!demand) throw new Error("Demanda não encontrada.");
    const mine = findOffer(demand, emailProdutor);
    if (!mine) throw new Error("Você não tem oferta nesta demanda.");

    demand.ofertas.splice(demand.ofertas.indexOf(mine), 1);
    // Sem a oferta, o pedido volta a ter o que falta e reabre.
    if (demand.status === "CONCLUIDA" && remainingQuantity(demand) > 0) demand.status = "ABERTA";
  }

  // A base é criada no primeiro contato com alguém conhecido (ao listar ou ao ofertar)
  // e recomeça quando outra pessoa entra, para as ofertas de exemplo serem sempre dela.
  private store(viewerEmail: string): Demand[] {
    if (!this.demands || this.seededFor !== viewerEmail) {
      this.demands = this.seed(viewerEmail);
      this.seededFor = viewerEmail;
    }
    return this.demands;
  }
}
