import type { PriceAnswerKind } from "@/lib/pricing/suggestion";
import type { SuggestedPrice } from "@/lib/pricing/suggestion";

// Uma resposta do produtor a uma proposta de preço (aceitou ou recusou aquele valor).
export interface PriceResponse {
  produto: string;
  price: number;
  answer: PriceAnswerKind;
}

// Tudo sobre preço. O site ainda não tem nada disto: só existe a versão simulada (MockPricingService).
// Dois preços diferentes, que não se misturam:
// - preço ofertado: o que o PRODUTOR pede pelo produto (getMyPrices / setMyPrice);
// - preço sugerido: a média da plataforma, só uma referência (getSuggestedPrices).
export interface PricingGateway {
  // Preços ofertados pelo produtor, pela chave do produto (priceKey).
  getMyPrices(email: string): Promise<Record<string, number>>;
  // Define o preço ofertado de um produto; null remove.
  setMyPrice(email: string, produto: string, price: number | null): Promise<void>;
  // Preço sugerido (média ajustada) de cada produto, pela chave do produto.
  getSuggestedPrices(): Promise<Record<string, SuggestedPrice>>;
  // Guarda a resposta a uma proposta; é com elas que o preço sugerido é ajustado.
  recordResponse(email: string, response: PriceResponse): Promise<void>;
}
