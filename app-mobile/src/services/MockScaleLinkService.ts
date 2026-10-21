import { buildLinkKey, normalizeDeviceId, producerRef } from "@/lib/delivery/scaleLink";
import type { ScaleDevice, ScaleLink } from "@/types/scaleLink";
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
];

export class MockScaleLinkService implements ScaleLinkGateway {
  private readonly devices: ScaleDevice[];
  private readonly latencyMs: number;
  private readonly now: () => Date;
  private readonly links = new Map<string, ScaleLink>();

  constructor({
    devices = MOCK_SCALE_DEVICES,
    latencyMs = DEFAULT_MOCK_LATENCY_MS,
    now = () => new Date(),
  }: MockScaleLinkOptions = {}) {
    this.devices = devices;
    this.latencyMs = latencyMs;
    this.now = now;
  }

  async getLink(email: string): Promise<ScaleLink | null> {
    await wait(this.latencyMs);
    const link = this.links.get(email);
    return link ? { ...link } : null;
  }

  async findDevices(): Promise<ScaleDevice[]> {
    await wait(this.latencyMs);
    return this.devices.map((device) => ({ ...device }));
  }

  async link(email: string, deviceId: string): Promise<ScaleLink> {
    await wait(this.latencyMs);
    const wanted = normalizeDeviceId(deviceId);
    const device = this.devices.find((item) => normalizeDeviceId(item.id) === wanted);
    if (!device) throw new Error("Não encontramos essa balança. Ligue-a e procure de novo.");

    // Uma balança só pode estar com um produtor por vez.
    for (const [owner, link] of this.links) {
      if (owner !== email && normalizeDeviceId(link.deviceId) === wanted) {
        throw new Error("Esta balança já está vinculada a outra conta.");
      }
    }

    const link: ScaleLink = {
      deviceId: device.id,
      deviceName: device.name,
      key: buildLinkKey(producerRef(email), device.id),
      linkedAt: this.now().toISOString(),
    };
    this.links.set(email, link);
    return { ...link };
  }

  async unlink(email: string): Promise<void> {
    await wait(this.latencyMs);
    this.links.delete(email);
  }
}
