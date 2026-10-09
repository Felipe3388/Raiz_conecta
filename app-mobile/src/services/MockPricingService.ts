import type { MarketData } from "@/lib/pricing/insights";
import { priceKey } from "@/lib/pricing/price";
import { suggestPrice, type PriceSignal, type SuggestedPrice } from "@/lib/pricing/suggestion";
import type { PriceResponse, PricingGateway } from "./PricingGateway";
import { DEFAULT_MOCK_LATENCY_MS, wait } from "./mockLatency";

interface MockPricingOptions {
  // Dados do mercado por produto (vendas e período anterior). Os preços pedidos vêm dos sinais.
  market: MarketData[];
  // O que se sabe de cada produto antes do uso (preços pedidos por outros produtores e respostas), por chave.
  signals: Record<string, PriceSignal[]>;
  // Preços de exemplo de quem entra (opcional).
  seedMyPrices?: (email: string) => Record<string, number>;
  latencyMs?: number;
}

const OTHERS = "__outros__";

// Preços guardados em memória. O preço de cada produtor entra na média dos produtos dele, e cada resposta
// a uma proposta ajusta o preço sugerido, como o sistema real fará com a base de dados.
export class MockPricingService implements PricingGateway {
  private readonly market: MarketData[];
  private readonly latencyMs: number;
  private readonly seedMyPrices: (email: string) => Record<string, number>;
  // Preços pedidos: produto -> (produtor -> preço). Os do seed ficam sob um produtor "outros" por preço.
  private readonly asked = new Map<string, Map<string, number>>();
  private readonly responses = new Map<string, PriceSignal[]>();
  private readonly mine = new Map<string, Record<string, number>>();

  constructor({ market, signals, seedMyPrices = () => ({}), latencyMs = DEFAULT_MOCK_LATENCY_MS }: MockPricingOptions) {
    this.market = market;
    this.latencyMs = latencyMs;
    this.seedMyPrices = seedMyPrices;

    for (const [key, list] of Object.entries(signals)) {
      const askedByOthers = new Map<string, number>();
      list
        .filter((signal) => signal.kind === "asked")
        .forEach((signal, index) => askedByOthers.set(`${OTHERS}${index}`, signal.price));
      this.asked.set(key, askedByOthers);
      this.responses.set(
        key,
        list.filter((signal) => signal.kind !== "asked"),
      );
    }
  }

  private pricesOf(email: string): Record<string, number> {
    let prices = this.mine.get(email);
    if (!prices) {
      prices = { ...this.seedMyPrices(email) };
      this.mine.set(email, prices);
      // Os preços de exemplo de quem entra também contam como preço pedido.
      for (const [key, price] of Object.entries(prices)) this.askedFor(key).set(email, price);
    }
    return prices;
  }

  private askedFor(key: string): Map<string, number> {
    let byProducer = this.asked.get(key);
    if (!byProducer) {
      byProducer = new Map();
      this.asked.set(key, byProducer);
    }
    return byProducer;
  }

  private signalsOf(key: string): PriceSignal[] {
    const asked: PriceSignal[] = [...this.askedFor(key).values()].map((price) => ({ kind: "asked", price }));
    return [...asked, ...(this.responses.get(key) ?? [])];
  }

  async getMyPrices(email: string): Promise<Record<string, number>> {
    await wait(this.latencyMs);
    return { ...this.pricesOf(email) };
  }

  async setMyPrice(email: string, produto: string, price: number | null): Promise<void> {
    await wait(this.latencyMs);
    if (price !== null && !(Number.isFinite(price) && price > 0)) throw new Error("Informe um preço válido.");

    const key = priceKey(produto);
    const prices = this.pricesOf(email);
    if (price === null) {
      delete prices[key];
      this.askedFor(key).delete(email);
    } else {
      prices[key] = price;
      this.askedFor(key).set(email, price);
    }
  }

  async getSuggestedPrices(): Promise<Record<string, SuggestedPrice>> {
    await wait(this.latencyMs);
    const keys = new Set([...this.asked.keys(), ...this.responses.keys()]);
    const result: Record<string, SuggestedPrice> = {};
    for (const key of keys) {
      const suggestion = suggestPrice(this.signalsOf(key));
      if (suggestion) result[key] = suggestion;
    }
    return result;
  }

  async recordResponse(_email: string, { produto, price, answer }: PriceResponse): Promise<void> {
    await wait(this.latencyMs);
    const key = priceKey(produto);
    this.responses.set(key, [...(this.responses.get(key) ?? []), { kind: answer, price }]);
  }

  async getMarketData(): Promise<MarketData[]> {
    await wait(this.latencyMs);
    return this.market.map((item) => ({
      ...item,
      askedPrices: [...this.askedFor(priceKey(item.produto)).values()],
    }));
  }
}
