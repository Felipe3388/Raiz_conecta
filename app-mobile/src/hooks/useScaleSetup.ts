import { useCallback, useEffect, useMemo, useState } from "react";
import { SCALE_SETUP } from "@/content/scaleTexts";
import { normalizeDeviceId, scaleDisplayName } from "@/lib/delivery/scaleLink";
import type { ScaleDevice } from "@/types/scaleLink";
import { useScaleLink } from "./useScaleLink";
import { useToast } from "./useToast";

// Controller da tela Balança: lista as balanças do produtor (a conectada em destaque), conecta outra, remove e
// adiciona uma nova em 2 passos (escolher a balança encontrada e confirmar).
export function useScaleSetup() {
  const scale = useScaleLink();
  const toast = useToast();
  const { findDevices } = scale;
  const [found, setFound] = useState<ScaleDevice[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selected, setSelected] = useState<ScaleDevice | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  const search = useCallback(async () => {
    setIsSearching(true);
    setSelected(null);
    try {
      setFound(await findDevices());
    } catch (error) {
      toast.show("error", error instanceof Error ? error.message : "Erro de conexão.");
    } finally {
      setIsSearching(false);
      setHasSearched(true);
    }
  }, [findDevices, toast]);

  // Sem nenhuma balança a tela já abre no "adicionar"; com balanças, só quando a pessoa toca em Adicionar.
  const isReady = scale.status === "ready";
  const showAdd = isReady && (isAdding || scale.scales.length === 0);
  useEffect(() => {
    if (showAdd && !hasSearched && !isSearching) void search();
  }, [showAdd, hasSearched, isSearching, search]);

  // As balanças que já estão na conta não aparecem de novo na busca.
  const devices = useMemo(() => {
    const owned = new Set(scale.scales.map((item) => normalizeDeviceId(item.deviceId)));
    return found.filter((device) => !owned.has(normalizeDeviceId(device.id)));
  }, [found, scale.scales]);

  async function run(action: () => Promise<void>) {
    setIsWorking(true);
    try {
      await action();
    } catch (error) {
      toast.show("error", error instanceof Error ? error.message : "Erro de conexão.");
    } finally {
      setIsWorking(false);
    }
  }

  const confirm = () =>
    selected
      ? run(async () => {
          await scale.addScale(selected.id);
          setSelected(null);
          setIsAdding(false);
          setHasSearched(false);
          toast.show("success", SCALE_SETUP.addedToast);
        })
      : Promise.resolve();

  const connect = (deviceId: string) =>
    run(async () => {
      await scale.activateScale(deviceId);
      toast.show("success", SCALE_SETUP.connectedToast);
    });

  const confirmRemove = () =>
    removing
      ? run(async () => {
          await scale.removeScale(removing);
          setRemoving(null);
          toast.show("success", SCALE_SETUP.removedToast);
        })
      : Promise.resolve();

  const toRemove = scale.scales.find((item) => item.deviceId === removing) ?? null;

  return {
    status: scale.status,
    reload: scale.reload,
    // Cada balança com o nome que aparece na tela e se é a conectada.
    scales: scale.scales.map((item) => ({
      deviceId: item.deviceId,
      name: scaleDisplayName(item),
      originalName: item.nickname ? item.deviceName : null,
      isActive: item.deviceId === scale.link?.deviceId,
    })),
    connect,
    isWorking,
    add: {
      isOpen: showAdd,
      canCancel: scale.scales.length > 0,
      open: () => setIsAdding(true),
      cancel: () => {
        setIsAdding(false);
        setSelected(null);
      },
      // O passo em que o produtor está: 1 escolhe a balança, 2 confirma.
      step: selected ? (2 as const) : (1 as const),
      devices,
      isSearching,
      hasSearched,
      search,
      selected,
      select: setSelected,
      backToChoice: () => setSelected(null),
      confirm,
    },
    remove: {
      name: toRemove ? scaleDisplayName(toRemove) : "",
      isConfirming: removing !== null,
      ask: setRemoving,
      cancel: () => setRemoving(null),
      confirm: confirmRemove,
    },
  };
}
