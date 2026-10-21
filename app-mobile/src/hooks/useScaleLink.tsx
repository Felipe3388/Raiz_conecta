import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getScaleLinkService, type ScaleLinkGateway } from "@/services";
import type { ScaleDevice, ScaleLink } from "@/types/scaleLink";

type LoadStatus = "loading" | "ready" | "error";

interface ScaleLinkData {
  status: LoadStatus;
  // A balança vinculada ao produtor, ou null.
  link: ScaleLink | null;
  findDevices: () => Promise<ScaleDevice[]>;
  linkScale: (deviceId: string) => Promise<ScaleLink>;
  unlinkScale: () => Promise<void>;
  reload: () => Promise<void>;
}

const ScaleLinkContext = createContext<ScaleLinkData | null>(null);

interface ProviderProps {
  email: string;
  children: ReactNode;
  gateway?: ScaleLinkGateway;
}

// A balança vinculada ao produtor, compartilhada pelas telas (a aba Mais mostra o estado; a tela Balança vincula).
export function ScaleLinkProvider({ email, children, gateway = getScaleLinkService() }: ProviderProps) {
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [link, setLink] = useState<ScaleLink | null>(null);

  const reload = useCallback(async () => {
    setStatus("loading");
    try {
      setLink(await gateway.getLink(email));
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, [gateway, email]);

  useEffect(() => {
    reload();
  }, [reload]);

  const linkScale = useCallback(
    async (deviceId: string) => {
      const created = await gateway.link(email, deviceId);
      setLink(created);
      return created;
    },
    [gateway, email],
  );

  const unlinkScale = useCallback(async () => {
    await gateway.unlink(email);
    setLink(null);
  }, [gateway, email]);

  const value = useMemo<ScaleLinkData>(
    () => ({ status, link, findDevices: () => gateway.findDevices(), linkScale, unlinkScale, reload }),
    [status, link, gateway, linkScale, unlinkScale, reload],
  );

  return <ScaleLinkContext.Provider value={value}>{children}</ScaleLinkContext.Provider>;
}

export function useScaleLink(): ScaleLinkData {
  const context = useContext(ScaleLinkContext);
  if (!context) throw new Error("useScaleLink deve ser usado dentro de ScaleLinkProvider.");
  return context;
}
