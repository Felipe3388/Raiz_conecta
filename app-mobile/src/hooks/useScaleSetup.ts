import { useCallback, useEffect, useState } from "react";
import { SCALE_SETUP } from "@/content/scaleTexts";
import type { ScaleDevice } from "@/types/scaleLink";
import { useScaleLink } from "./useScaleLink";
import { useToast } from "./useToast";

// Controller da tela Balança, em 2 passos: 1) escolher a balança encontrada, 2) confirmar o vínculo.
// Com a balança já vinculada, a tela mostra o estado dela e o botão de desvincular.
export function useScaleSetup() {
  const scale = useScaleLink();
  const toast = useToast();
  const { findDevices } = scale;
  const [devices, setDevices] = useState<ScaleDevice[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selected, setSelected] = useState<ScaleDevice | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const [isConfirmingUnlink, setIsConfirmingUnlink] = useState(false);

  const search = useCallback(async () => {
    setIsSearching(true);
    setSelected(null);
    try {
      setDevices(await findDevices());
    } catch (error) {
      toast.show("error", error instanceof Error ? error.message : "Erro de conexão.");
    } finally {
      setIsSearching(false);
      setHasSearched(true);
    }
  }, [findDevices, toast]);

  // Sem balança vinculada, já começa procurando: o produtor só precisa escolher.
  const needsSetup = scale.status === "ready" && scale.link === null;
  useEffect(() => {
    if (needsSetup && !hasSearched && !isSearching) void search();
  }, [needsSetup, hasSearched, isSearching, search]);

  async function confirm() {
    if (!selected) return;
    setIsWorking(true);
    try {
      await scale.linkScale(selected.id);
      setSelected(null);
      toast.show("success", SCALE_SETUP.linkedToast);
    } catch (error) {
      toast.show("error", error instanceof Error ? error.message : "Erro de conexão.");
    } finally {
      setIsWorking(false);
    }
  }

  async function unlink() {
    setIsWorking(true);
    try {
      await scale.unlinkScale();
      setIsConfirmingUnlink(false);
      setHasSearched(false);
      toast.show("success", SCALE_SETUP.unlinkedToast);
    } catch (error) {
      toast.show("error", error instanceof Error ? error.message : "Erro de conexão.");
    } finally {
      setIsWorking(false);
    }
  }

  return {
    status: scale.status,
    reload: scale.reload,
    link: scale.link,
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
    isWorking,
    unlink: {
      isConfirming: isConfirmingUnlink,
      ask: () => setIsConfirmingUnlink(true),
      cancel: () => setIsConfirmingUnlink(false),
      confirm: unlink,
    },
  };
}
