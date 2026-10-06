import { env } from "@/config/env";
import { getApiClient } from "@/lib/http";
import { getTokenStorage } from "@/lib/storage";
import type { AuthGateway } from "./AuthGateway";
import { AuthService } from "./authService";
import type { CepGateway } from "./CepGateway";
import { CepService } from "./CepService";
import { MockAuthService } from "./MockAuthService";
import { MockRegistrationService } from "./MockRegistrationService";
import type { RegistrationGateway } from "./RegistrationGateway";
import { RegistrationService } from "./RegistrationService";

// Composição: cada serviço é criado uma vez e escolhido entre real e simulado conforme o .env.
let authService: AuthGateway | null = null;
let registrationService: RegistrationGateway | null = null;
let cepService: CepGateway | null = null;

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

export { AuthError } from "./AuthError";
export type { AuthGateway } from "./AuthGateway";
export type { CepGateway, CepLookup } from "./CepGateway";
export type { RegistrationGateway } from "./RegistrationGateway";
