import { env } from "@/config/env";
import { getApiClient } from "@/lib/http";
import { DEFAULT_MY_PRODUCT_IDS, MOCK_PRODUCTS } from "@/mocks/catalogData";
import { MOCK_PRICE_SIGNALS, seedMyPrices } from "@/mocks/priceData";
import { seedProposals } from "@/mocks/proposalData";
import { seedSuggestions } from "@/mocks/suggestionData";
import { getTokenStorage } from "@/lib/storage";
import type { AssistantGateway } from "./AssistantGateway";
import { ApiCatalogService } from "./ApiCatalogService";
import { ApiProfileService } from "./ApiProfileService";
import { ApiScaleLinkService } from "./ApiScaleLinkService";
import { ApiScaleService } from "./ApiScaleService";
import type { AuthGateway } from "./AuthGateway";
import { AuthService } from "./authService";
import type { CatalogGateway } from "./CatalogGateway";
import type { CepGateway } from "./CepGateway";
import { CepService } from "./CepService";
import type { DeliveryGateway } from "./DeliveryGateway";
import { FixedAssistantService } from "./FixedAssistantService";
import { MockAuthService } from "./MockAuthService";
import { MockCatalogService } from "./MockCatalogService";
import { MockDeliveryService } from "./MockDeliveryService";
import { MockPricingService } from "./MockPricingService";
import { MockProposalService } from "./MockProposalService";
import { MockProfileService } from "./MockProfileService";
import { MockRegistrationService } from "./MockRegistrationService";
import { MockScaleService } from "./MockScaleService";
import type { PricingGateway } from "./PricingGateway";
import type { ProposalGateway } from "./ProposalGateway";
import type { ProfileGateway } from "./ProfileGateway";
import type { RegistrationGateway } from "./RegistrationGateway";
import { RegistrationService } from "./RegistrationService";
import type { ScaleGateway } from "./ScaleGateway";
import type { ScaleLinkGateway } from "./ScaleLinkGateway";
import { MockScaleLinkService } from "./MockScaleLinkService";

// Composição: cada serviço é criado uma vez e escolhido entre real e simulado conforme o .env.
let authService: AuthGateway | null = null;
let registrationService: RegistrationGateway | null = null;
let cepService: CepGateway | null = null;
let catalogService: CatalogGateway | null = null;
let proposalService: ProposalGateway | null = null;
let profileService: ProfileGateway | null = null;
let pricingService: PricingGateway | null = null;
let deliveryService: DeliveryGateway | null = null;
let scaleService: ScaleGateway | null = null;
let scaleLinkService: ScaleLinkGateway | null = null;
let assistantService: AssistantGateway | null = null;

export function getAuthService(): AuthGateway {
  authService ??= env.useMocks ? new MockAuthService() : new AuthService(getApiClient(), getTokenStorage());
  return authService;
}

export function getRegistrationService(): RegistrationGateway {
  registrationService ??= env.useMocks ? new MockRegistrationService() : new RegistrationService(getApiClient());
  return registrationService;
}

// O ViaCEP é um serviço público: funciona igual com a API real ou simulada.
export function getCepService(): CepGateway {
  cepService ??= new CepService();
  return cepService;
}

// Área do Produtor. Catálogo, sugestão de produto, Meu Perfil e a balança (vínculo e peso ao vivo) já têm API no
// app-principal e trocam de simulado para real pelo EXPO_PUBLIC_USE_MOCKS. O resto (propostas com preço fixo, entregas e
// pesagem, preços) ainda não existe no site e continua simulado, mesmo com a API ligada (ver ARQUITETURA.md).
export function getCatalogService(): CatalogGateway {
  if (!catalogService) {
    const mock = new MockCatalogService({
      products: MOCK_PRODUCTS,
      defaultMyProductIds: DEFAULT_MY_PRODUCT_IDS,
      seedSuggestions,
    });
    catalogService = env.useMocks ? mock : new ApiCatalogService(getApiClient(), mock);
  }
  return catalogService;
}

// Propostas dos mercados (preço fixo, aceitar ou recusar): o site ainda não tem nada disto, só a versão simulada.
export function getProposalService(): ProposalGateway {
  proposalService ??= new MockProposalService({ seed: seedProposals });
  return proposalService;
}

export function getProfileService(): ProfileGateway {
  profileService ??= env.useMocks ? new MockProfileService() : new ApiProfileService(getApiClient());
  return profileService;
}

// Preços (preço ofertado, preço sugerido e médias de venda): o site ainda não tem nada disto,
// então só existe a versão simulada.
export function getPricingService(): PricingGateway {
  pricingService ??= new MockPricingService({
    signals: MOCK_PRICE_SIGNALS,
    seedMyPrices,
  });
  return pricingService;
}

// Entregas e pesagem: o site ainda não tem nada disto, então só existe a versão simulada. Toda proposta que o produtor
// aceita vira uma entrega, por isso ela lê as propostas do mesmo serviço que a aba Ofertas usa.
export function getDeliveryService(): DeliveryGateway {
  deliveryService ??= new MockDeliveryService({ proposals: getProposalService() });
  return deliveryService;
}

// O peso da balança do produtor: simulado, ou o do módulo ESP32 que o servidor recebe (consultado a cada 0,5 s).
export function getScaleService(): ScaleGateway {
  scaleService ??= env.useMocks ? new MockScaleService() : new ApiScaleService(getApiClient());
  return scaleService;
}

// O vínculo da balança com o produtor (chave do par produtor + balança): simulado ou o do servidor.
export function getScaleLinkService(): ScaleLinkGateway {
  scaleLinkService ??= env.useMocks ? new MockScaleLinkService() : new ApiScaleLinkService(getApiClient());
  return scaleLinkService;
}

// Ajuda: respostas fixas, sem rede. Um chatbot de verdade entra aqui no futuro.
export function getAssistantService(): AssistantGateway {
  assistantService ??= new FixedAssistantService();
  return assistantService;
}

export { AuthError } from "./AuthError";
export type { AssistantGateway } from "./AssistantGateway";
export type { AuthGateway } from "./AuthGateway";
export type { CatalogGateway } from "./CatalogGateway";
export type { CepGateway, CepLookup } from "./CepGateway";
export type { DeliveryGateway } from "./DeliveryGateway";
export type { PriceResponse, PricingGateway } from "./PricingGateway";
export type { PasswordChange, ProfileGateway } from "./ProfileGateway";
export type { ProposalGateway } from "./ProposalGateway";
export type { ScaleLinkGateway } from "./ScaleLinkGateway";
export type { RegistrationGateway } from "./RegistrationGateway";
export type { ScaleConnection, ScaleGateway, ScaleReading, ScaleSimulator, SubscribeOptions } from "./ScaleGateway";
