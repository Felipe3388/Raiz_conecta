import type { ApiClient } from "@/lib/http/ApiClient";
import { normalizeDeviceId } from "@/lib/delivery/scaleLink";
import type { ScaleDevice, ScaleLink, ScaleState } from "@/types/scaleLink";
import type { ScaleLinkGateway } from "./ScaleLinkGateway";

// As balanças do produtor ligadas à API do app-principal (/api/produtor/balancas). O servidor usa o produtor da sessão,
// então o e-mail que as telas passam não vai na requisição. O formato que ele devolve é o mesmo de ScaleLink/ScaleState.
export class ApiScaleLinkService implements ScaleLinkGateway {
  readonly discovery = "label" as const;

  constructor(private readonly api: Pick<ApiClient, "get" | "post" | "put" | "patch" | "delete">) {}

  getState(): Promise<ScaleState> {
    return this.api.get<ScaleState>("/api/produtor/balancas");
  }

  // O servidor não enxerga o que está perto do celular: com a API, a balança é achada pelo endereço e código da etiqueta.
  async findDevices(): Promise<ScaleDevice[]> {
    return [];
  }

  add(_email: string, deviceId: string, code?: string): Promise<ScaleLink> {
    return this.api.post<ScaleLink>("/api/produtor/balancas", { deviceId: normalizeDeviceId(deviceId), ...(code ? { codigo: code } : {}) });
  }

  async activate(_email: string, deviceId: string): Promise<void> {
    await this.api.put(`${this.path(deviceId)}/conectada`);
  }

  rename(_email: string, deviceId: string, nickname: string | null): Promise<ScaleLink> {
    return this.api.patch<ScaleLink>(this.path(deviceId), { apelido: nickname });
  }

  async remove(_email: string, deviceId: string): Promise<void> {
    await this.api.delete(this.path(deviceId));
  }

  private path(deviceId: string): string {
    return `/api/produtor/balancas/${normalizeDeviceId(deviceId)}`;
  }
}
