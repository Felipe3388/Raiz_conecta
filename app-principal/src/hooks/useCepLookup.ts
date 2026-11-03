"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { lookupCep, type CepAddress } from "@/lib/address/viacep";

// Busca o endereço quando o CEP fica completo. Uma busca nova cancela a anterior (quem digita rápido não recebe o
// endereço de um CEP antigo) e sair da tela cancela a que estiver em andamento.
export function useCepLookup(onFound: (address: CepAddress) => void) {
  const [lookingUp, setLookingUp] = useState(false);
  const current = useRef<AbortController | null>(null);
  const found = useRef(onFound);
  useEffect(() => {
    found.current = onFound;
  });
  useEffect(() => () => current.current?.abort(), []);

  const lookup = useCallback(async (maskedCep: string) => {
    if (maskedCep.length !== 9) return;
    current.current?.abort();
    const controller = new AbortController();
    current.current = controller;
    setLookingUp(true);
    const result = await lookupCep(maskedCep, controller.signal);
    if (controller.signal.aborted) return;
    setLookingUp(false);
    if (result.found) found.current(result.address);
    else if (result.error) toast.error(result.error);
  }, []);

  return { lookingUp, lookup };
}
