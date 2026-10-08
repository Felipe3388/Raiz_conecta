import { env } from "@/config/env";
import { getApiClient } from "@/lib/http";
import { DEFAULT_MY_PRODUCT_IDS, MOCK_PRODUCTS } from "@/mocks/catalogData";
import { seedDemands } from "@/mocks/demandData";
import { seedSuggestions } from "@/mocks/suggestionData";
import { getTokenStorage } from "@/lib/storage";
import type { AssistantGateway } from "./AssistantGateway";
import type { AuthGateway } from "./AuthGateway";
import { AuthService } from "./authService";
import type { CatalogGateway } from "./CatalogGateway";
import type { CepGateway } from "./CepGateway";
import { CepService } from "./CepService";
import type { DemandGateway } from "./DemandGateway";
import { FixedAssistantService } from "./FixedAssistantService";
import { MockAuthService } from "./MockAuthService";
import { MockCatalogService } from "./MockCatalogService";
import { MockDemandService } from "./MockDemandService";
import { MockProfileService } from "./MockProfileService";
import { MockRegistrationService } from "./MockRegistrationService";
import type { ProfileGateway } from "./ProfileGateway";
import type { RegistrationGateway } from "./RegistrationGateway";
import { RegistrationService } from "./RegistrationService";

// Composição: cada serviço é criado uma vez e escolhido entre real e simulado conforme o .env.
let authService: AuthGateway | null = null;
let registrationService: RegistrationGateway | null = null;
let cepService: CepGateway | null = null;
let catalogService: CatalogGateway | null = null;
let demandService: DemandGateway | null = null;
let profileService: ProfileGateway | null = null;
let assistantService: AssistantGateway | null = null;

export function getAuthService(): AuthGateway {
  authService ??= env.useMocks
    ? new MockAuthService()
    : new AuthService(getApiClient(), getTokenStorage());
  return authService;
}

export function getRegistrationService(): RegistrationGateway {
  registrationService ??= env.useMocks
    ? new MockRegistrationService()
    : new RegistrationService(getApiClient());
  return registrationService;
}

// O ViaCEP é um serviço público: funciona igual com a API real ou simulada.
export function getCepService(): CepGateway {
  cepService ??= new CepService();
  return cepService;
}

// Área do Produtor (Mural, Catálogo, Ofertas, Perfil): por ora só existe a versão simulada.
// Quando as APIs forem ligadas, cada getter passa a escolher entre real e simulada como os de cima.
export function getCatalogService(): CatalogGateway {
  catalogService ??= new MockCatalogService({
    products: MOCK_PRODUCTS,
    defaultMyProductIds: DEFAULT_MY_PRODUCT_IDS,
    seedSuggestions,
  });
  return catalogService;
}

export function getDemandService(): DemandGateway {
  demandService ??= new MockDemandService({ seed: seedDemands });
  return demandService;
}

export function getProfileService(): ProfileGateway {
  profileService ??= new MockProfileService();
  return profileService;
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
export type { DemandGateway } from "./DemandGateway";
export type { ProfileGateway } from "./ProfileGateway";
export type { RegistrationGateway } from "./RegistrationGateway";
