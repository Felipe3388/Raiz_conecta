import { buildLinkKey, normalizeDeviceId, producerRef } from "@/lib/delivery/scaleLink";
import type { ScaleDevice, ScaleLink, ScaleState } from "@/types/scaleLink";
import { DEFAULT_MOCK_LATENCY_MS, wait } from "./mockLatency";
import type { ScaleLinkGateway } from "./ScaleLinkGateway";

interface MockScaleLinkOptions {
  devices?: ScaleDevice[];
  latencyMs?: number;
  now?: () => Date;
}

// Balanças de exemplo "ao alcance". Os ids têm o formato de um endereço MAC.
export const MOCK_SCALE_DEVICES: ScaleDevice[] = [
  { id: "A4:CF:12:9B:07:E1", name: "Balança RC-01" },
  { id: "A4:CF:12:9B:08:3C", name: "Balança RC-02" },
  { id: "A4:CF:12:9B:09:5D", name: "Balança RC-03" },
];

const NOT_FOUND = "Não encontramos essa balança. Ligue-a e procure de novo.";
const NOT_YOURS = "Essa balança não está na sua conta.";

export class MockScaleLinkService implements ScaleLinkGateway {
  private readonly devices: ScaleDevice[];
  private readonly latencyMs: number;
  private readonly now: () => Date;
  private readonly accounts = new Map<string, ScaleState>();

  constructor({
    devices = MOCK_SCALE_DEVICES,
    latencyMs = DEFAULT_MOCK_LATENCY_MS,
    now = () => new Date(),
  }: MockScaleLinkOptions = {}) {
    this.devices = devices;
    this.latencyMs = latencyMs;
    this.now = now;
  }

  async getState(email: string): Promise<ScaleState> {
    await wait(this.latencyMs);
    return this.snapshot(email);
  }

  async findDevices(): Promise<ScaleDevice[]> {
    await wait(this.latencyMs);
    return this.devices.map((device) => ({ ...device }));
  }

  async add(email: string, deviceId: string): Promise<ScaleLink> {
    await wait(this.latencyMs);
    const wanted = normalizeDeviceId(deviceId);
    const device = this.devices.find((item) => normalizeDeviceId(item.id) === wanted);
    if (!device) throw new Error(NOT_FOUND);

    // Uma balança só pode estar com um produtor por vez.
    for (const [owner, state] of this.accounts) {
      if (owner !== email && state.scales.some((scale) => normalizeDeviceId(scale.deviceId) === wanted)) {
        throw new Error("Esta balança já está vinculada a outra conta.");
      }
    }

    const state = this.state(email);
    const existing = state.scales.find((scale) => normalizeDeviceId(scale.deviceId) === wanted);
    const scale: ScaleLink = existing ?? {
      deviceId: device.id,
      deviceName: device.name,
      nickname: null,
      key: buildLinkKey(producerRef(email), device.id),
      linkedAt: this.now().toISOString(),
    };
    if (!existing) state.scales.push(scale);
    state.activeDeviceId = scale.deviceId;
    return { ...scale };
  }

  async activate(email: string, deviceId: string): Promise<void> {
    await wait(this.latencyMs);
    const state = this.state(email);
    state.activeDeviceId = this.find(state, deviceId).deviceId;
  }

  async rename(email: string, deviceId: string, nickname: string | null): Promise<ScaleLink> {
    await wait(this.latencyMs);
    const scale = this.find(this.state(email), deviceId);
    scale.nickname = nickname;
    return { ...scale };
  }

  async remove(email: string, deviceId: string): Promise<void> {
    await wait(this.latencyMs);
    const state = this.state(email);
    const scale = this.find(state, deviceId);
    state.scales = state.scales.filter((item) => item !== scale);
    if (state.activeDeviceId === scale.deviceId) state.activeDeviceId = null;
  }

  private state(email: string): ScaleState {
    let state = this.accounts.get(email);
    if (!state) {
      state = { scales: [], activeDeviceId: null };
      this.accounts.set(email, state);
    }
    return state;
  }

  private find(state: ScaleState, deviceId: string): ScaleLink {
    const wanted = normalizeDeviceId(deviceId);
    const scale = state.scales.find((item) => normalizeDeviceId(item.deviceId) === wanted);
    if (!scale) throw new Error(NOT_YOURS);
    return scale;
  }

  private snapshot(email: string): ScaleState {
    const state = this.state(email);
    return { scales: state.scales.map((scale) => ({ ...scale })), activeDeviceId: state.activeDeviceId };
  }
}
