import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { cleanScaleName, scaleDisplayName } from "@/lib/delivery/scaleLink";
import { getScaleLinkService, type ScaleLinkGateway } from "@/services";
import type { ScaleDevice, ScaleLink, ScaleState } from "@/types/scaleLink";

type LoadStatus = "loading" | "ready" | "error";

interface ScaleLinkData {
  status: LoadStatus;
  // Todas as balanças do produtor.
  scales: ScaleLink[];
  // A balança conectada (a que a pesagem usa), ou null.
  link: ScaleLink | null;
  // O nome da balança conectada, como aparece na tela (o do produtor ou o original), ou null.
  activeName: string | null;
  findDevices: () => Promise<ScaleDevice[]>;
  addScale: (deviceId: string) => Promise<ScaleLink>;
  activateScale: (deviceId: string) => Promise<void>;
  // O nome que o produtor escolheu; vazio volta ao nome original.
  renameScale: (deviceId: string, text: string) => Promise<void>;
  removeScale: (deviceId: string) => Promise<void>;
  reload: () => Promise<void>;
}

const EMPTY: ScaleState = { scales: [], activeDeviceId: null };

const ScaleLinkContext = createContext<ScaleLinkData | null>(null);

interface ProviderProps {
  email: string;
  children: ReactNode;
  gateway?: ScaleLinkGateway;
}

// As balanças do produtor, compartilhadas pelas telas: a aba Mais e a pesagem mostram a conectada; a tela Balança
// adiciona, conecta e remove; as Configurações dão o nome.
export function ScaleLinkProvider({ email, children, gateway = getScaleLinkService() }: ProviderProps) {
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [state, setState] = useState<ScaleState>(EMPTY);

  const reload = useCallback(async () => {
    setStatus("loading");
    try {
      setState(await gateway.getState(email));
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, [gateway, email]);

  useEffect(() => {
    reload();
  }, [reload]);

  // Depois de cada mudança o estado volta do serviço, para a tela nunca mostrar algo que o serviço não guardou.
  const refresh = useCallback(async () => setState(await gateway.getState(email)), [gateway, email]);

  const addScale = useCallback(
    async (deviceId: string) => {
      const added = await gateway.add(email, deviceId);
      await refresh();
      return added;
    },
    [gateway, email, refresh],
  );

  const activateScale = useCallback(
    async (deviceId: string) => {
      await gateway.activate(email, deviceId);
      await refresh();
    },
    [gateway, email, refresh],
  );

  const renameScale = useCallback(
    async (deviceId: string, text: string) => {
      await gateway.rename(email, deviceId, cleanScaleName(text));
      await refresh();
    },
    [gateway, email, refresh],
  );

  const removeScale = useCallback(
    async (deviceId: string) => {
      await gateway.remove(email, deviceId);
      await refresh();
    },
    [gateway, email, refresh],
  );

  const value = useMemo<ScaleLinkData>(() => {
    const link = state.scales.find((scale) => scale.deviceId === state.activeDeviceId) ?? null;
    return {
      status,
      scales: state.scales,
      link,
      activeName: link ? scaleDisplayName(link) : null,
      findDevices: () => gateway.findDevices(),
      addScale,
      activateScale,
      renameScale,
      removeScale,
      reload,
    };
  }, [status, state, gateway, addScale, activateScale, renameScale, removeScale, reload]);

  return <ScaleLinkContext.Provider value={value}>{children}</ScaleLinkContext.Provider>;
}

export function useScaleLink(): ScaleLinkData {
  const context = useContext(ScaleLinkContext);
  if (!context) throw new Error("useScaleLink deve ser usado dentro de ScaleLinkProvider.");
  return context;
}
