import type { RegistrationData } from "@/types/registration";

export interface RegistrationGateway {
  register(data: RegistrationData): Promise<void>;
}
