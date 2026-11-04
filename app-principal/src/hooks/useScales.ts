"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/http/client";
import { normalizeDeviceId } from "@/lib/iot/deviceId";
import { normalizePairingCode, scaleDisplayName, type ScaleLink, type ScaleState } from "@/lib/iot/label";

const BASE = "/api/produtor/balancas";
const path = (deviceId: string) => `${BASE}/${normalizeDeviceId(deviceId)}`;

// As balanças do produtor (mesmas rotas que o app usa). Cada ação avisa o resultado e lê a lista de novo.
export function useScales() {
  const [state, setState] = useState<ScaleState | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    const result = await api<ScaleState>(BASE, { cache: "no-store" });
    if (!result.ok || !result.data) return void setError(result.error);
    setState(result.data);
    setError("");
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial da tela: o estado é preenchido quando a resposta chega
    void reload();
  }, [reload]);

  // Roda uma ação, mostra o aviso e recarrega. Devolve se deu certo (o formulário fecha só quando deu).
  const run = useCallback(
    async (call: () => ReturnType<typeof api>, success: string): Promise<boolean> => {
      setBusy(true);
      const result = await call();
      setBusy(false);
      if (!result.ok) {
        toast.error(result.error);
        return false;
      }
      toast.success(success);
      await reload();
      return true;
    },
    [reload],
  );

  const active = state?.scales.find((scale) => state.activeDeviceId !== null && normalizeDeviceId(scale.deviceId) === normalizeDeviceId(state.activeDeviceId)) ?? null;

  return {
    state,
    error,
    busy,
    reload,
    active,
    activeName: active ? scaleDisplayName(active) : null,
    add: (deviceId: string, code: string) =>
      run(() => api(BASE, { method: "POST", json: { deviceId: normalizeDeviceId(deviceId), codigo: normalizePairingCode(code) } }), "Balança adicionada e conectada!"),
    activate: (scale: ScaleLink) => run(() => api(`${path(scale.deviceId)}/conectada`, { method: "PUT" }), `${scaleDisplayName(scale)} conectada.`),
    rename: (scale: ScaleLink, name: string) => run(() => api(path(scale.deviceId), { method: "PATCH", json: { apelido: name.trim() === "" ? null : name } }), "Nome da balança salvo."),
    remove: (scale: ScaleLink) => run(() => api(path(scale.deviceId), { method: "DELETE" }), "Balança removida."),
  };
}

export type ScalesController = ReturnType<typeof useScales>;
