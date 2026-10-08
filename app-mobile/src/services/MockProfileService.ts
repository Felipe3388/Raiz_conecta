import { seedProfile } from "@/mocks/profileData";
import type { EditableProfile, ProducerProfile } from "@/types/produtor";
import { DEFAULT_MOCK_LATENCY_MS, wait } from "./mockLatency";
import type { ProfileGateway } from "./ProfileGateway";

interface MockProfileOptions {
  latencyMs?: number;
}

export class MockProfileService implements ProfileGateway {
  private readonly latencyMs: number;
  private readonly profiles = new Map<string, ProducerProfile>();
  private readonly deleted = new Set<string>();

  constructor({ latencyMs = DEFAULT_MOCK_LATENCY_MS }: MockProfileOptions = {}) {
    this.latencyMs = latencyMs;
  }

  async getProfile(email: string): Promise<ProducerProfile> {
    await wait(this.latencyMs);
    return { ...this.find(email) };
  }

  // A senha nova é aceita e descartada: o modo simulado não guarda senhas.
  async updateProfile(email: string, changes: EditableProfile): Promise<ProducerProfile> {
    await wait(this.latencyMs);
    const updated = { ...this.find(email), ...changes };
    this.profiles.set(email, updated);
    return { ...updated };
  }

  async deleteAccount(email: string): Promise<void> {
    await wait(this.latencyMs);
    this.deleted.add(email);
  }

  private find(email: string): ProducerProfile {
    if (this.deleted.has(email)) throw new Error("Conta não encontrada.");
    let profile = this.profiles.get(email);
    if (!profile) {
      profile = seedProfile(email);
      this.profiles.set(email, profile);
    }
    return profile;
  }
}
