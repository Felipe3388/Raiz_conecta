import { weighingJudgement } from "@/lib/delivery/stage";
import { MAX_WEIGHING_KG } from "@/lib/delivery/weight";
import { addDays, dayKey } from "@/lib/delivery/schedule";
import { findOffer } from "@/lib/produtor/demands";
import type { Delivery, Receipt, Weighing, WeighingInput, WeighingSource } from "@/types/delivery";
import type { DeliveryGateway } from "./DeliveryGateway";
import type { DemandGateway } from "./DemandGateway";
import { DEFAULT_MOCK_LATENCY_MS, wait } from "./mockLatency";

interface MockDeliveryOptions {
  // De onde vêm as ofertas: no modo simulado, toda oferta do produtor vira uma entrega.
  demands: DemandGateway;
  // Dias até a entrega de cada pedido de exemplo (pelo id do pedido); os outros usam `defaultDays`.
  days?: Record<string, number>;
  defaultDays?: number;
  now?: () => Date;
  latencyMs?: number;
}

const SOURCES: WeighingSource[] = ["BALANCA", "DIGITADO"];

// O que muda numa entrega depois de criada. O resto vem da oferta.
interface Progress {
  dueDate: string;
  weighings: Weighing[];
  handedOverAt: string | null;
  handedOverOutOfRange: boolean;
  receipt: Receipt | null;
}

// Entregas guardadas em memória. Cada oferta do produtor vira uma entrega com dia marcado; as pesagens e
// o andamento ficam aqui, como o servidor faria com a base de dados.
export class MockDeliveryService implements DeliveryGateway {
  private readonly demands: DemandGateway;
  private readonly days: Record<string, number>;
  private readonly defaultDays: number;
  private readonly now: () => Date;
  private readonly latencyMs: number;
  private readonly progress = new Map<string, Progress>();
  // O que se sabe de cada entrega desde a última listagem (produto, quantidade...).
  private readonly known = new Map<string, Omit<Delivery, keyof Progress>>();
  private counter = 0;

  constructor({
    demands,
    days = {},
    defaultDays = 2,
    now = () => new Date(),
    latencyMs = DEFAULT_MOCK_LATENCY_MS,
  }: MockDeliveryOptions) {
    this.demands = demands;
    this.days = days;
    this.defaultDays = defaultDays;
    this.now = now;
    this.latencyMs = latencyMs;
  }

  async listDeliveries(email: string): Promise<Delivery[]> {
    await wait(this.latencyMs);
    const demands = await this.demands.listDemands(email);

    const deliveries: Delivery[] = [];
    for (const demand of demands) {
      const mine = findOffer(demand, email);
      if (!mine || demand.status === "CANCELADA") continue;

      const base = {
        id: demand.id,
        demandaId: demand.id,
        produto: demand.produto,
        unidade: demand.unidade,
        quantidade: mine.quantidade,
        preco: mine.preco ?? demand.precoMedio,
      };
      this.known.set(this.key(email, demand.id), base);
      deliveries.push(structuredClone({ ...base, ...this.progressOf(email, demand.id) }));
    }
    return deliveries;
  }

  async addWeighing(email: string, deliveryId: string, { kg, source }: WeighingInput): Promise<Delivery> {
    await wait(this.latencyMs);
    const progress = this.mutable(email, deliveryId);
    if (progress.handedOverAt) throw new Error("Esta entrega já foi para a logística.");
    this.checkWeighing(kg, source);

    progress.weighings.push({ id: `w-${++this.counter}`, kg, source, at: this.now().toISOString() });
    return this.snapshot(email, deliveryId);
  }

  async removeWeighing(email: string, deliveryId: string, weighingId: string): Promise<Delivery> {
    await wait(this.latencyMs);
    const progress = this.mutable(email, deliveryId);
    if (progress.handedOverAt) throw new Error("Esta entrega já foi para a logística.");
    const index = progress.weighings.findIndex((item) => item.id === weighingId);
    if (index < 0) throw new Error("Pesagem não encontrada.");

    progress.weighings.splice(index, 1);
    return this.snapshot(email, deliveryId);
  }

  async handOver(email: string, deliveryId: string): Promise<Delivery> {
    await wait(this.latencyMs);
    const progress = this.mutable(email, deliveryId);
    if (progress.handedOverAt) throw new Error("Esta entrega já foi para a logística.");
    if (progress.weighings.length === 0) throw new Error("Pese o produto antes de entregar à logística.");

    progress.handedOverOutOfRange = weighingJudgement(this.snapshot(email, deliveryId)).verdict !== "NA_FAIXA";
    progress.handedOverAt = this.now().toISOString();
    return this.snapshot(email, deliveryId);
  }

  async simulateReceipt(email: string, deliveryId: string, { kg, source }: WeighingInput): Promise<Delivery> {
    await wait(this.latencyMs);
    const progress = this.mutable(email, deliveryId);
    if (!progress.handedOverAt) throw new Error("A entrega ainda não foi para a logística.");
    if (progress.receipt) throw new Error("O mercado já pesou esta entrega.");
    this.checkWeighing(kg, source);

    progress.receipt = { kg, source, at: this.now().toISOString() };
    return this.snapshot(email, deliveryId);
  }

  private key(email: string, deliveryId: string) {
    return `${email.trim().toLowerCase()}|${deliveryId}`;
  }

  // O dia da entrega é marcado na primeira vez que ela aparece e não muda mais.
  private progressOf(email: string, deliveryId: string): Progress {
    const key = this.key(email, deliveryId);
    let progress = this.progress.get(key);
    if (!progress) {
      const days = this.days[deliveryId] ?? this.defaultDays;
      progress = {
        dueDate: addDays(dayKey(this.now()), days),
        weighings: [],
        handedOverAt: null,
        handedOverOutOfRange: false,
        receipt: null,
      };
      this.progress.set(key, progress);
    }
    return progress;
  }

  private mutable(email: string, deliveryId: string): Progress {
    if (!this.known.has(this.key(email, deliveryId))) throw new Error("Entrega não encontrada.");
    return this.progressOf(email, deliveryId);
  }

  private snapshot(email: string, deliveryId: string): Delivery {
    const base = this.known.get(this.key(email, deliveryId));
    if (!base) throw new Error("Entrega não encontrada.");
    return structuredClone({ ...base, ...this.progressOf(email, deliveryId) });
  }

  private checkWeighing(kg: number, source: WeighingSource) {
    if (!Number.isFinite(kg) || kg <= 0 || kg > MAX_WEIGHING_KG) throw new Error("Informe um peso válido.");
    if (!SOURCES.includes(source)) throw new Error("Origem do peso inválida.");
  }
}
