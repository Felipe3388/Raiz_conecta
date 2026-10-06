import { ApiError } from "@/lib/http/ApiError";
import type { RegistrationData } from "@/types/registration";
import type { RegistrationGateway } from "./RegistrationGateway";

interface MockRegistrationOptions {
  latencyMs?: number;
}

// E-mail começando com "existente" reproduz o erro de e-mail já cadastrado.
const EXISTING_EMAIL_PREFIX = "existente";

export class MockRegistrationService implements RegistrationGateway {
  private readonly latencyMs: number;

  constructor({ latencyMs = 800 }: MockRegistrationOptions = {}) {
    this.latencyMs = latencyMs;
  }

  async register({ account }: RegistrationData): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, this.latencyMs));

    if (account.email.trim().toLowerCase().startsWith(EXISTING_EMAIL_PREFIX)) {
      throw new ApiError("Este e-mail já está cadastrado.", 400);
    }
  }
}
