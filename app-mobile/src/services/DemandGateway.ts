import type { Demand, OfferRequest } from "@/types/produtor";

// O que o Mural e as Ofertas precisam. Implementado pela API real (a fazer) e pelo MockDemandService.
export interface DemandGateway {
  // GET /api/mercado/demandas. A API devolve as mesmas demandas para todos (o filtro por produtor
  // é feito no app); o e-mail só serve ao modo simulado, para criar ofertas de exemplo dessa pessoa.
  listDemands(viewerEmail: string): Promise<Demand[]>;
  // POST /api/produtor/ofertas
  sendOffer(request: OfferRequest): Promise<void>;
}
