import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { activeUndo, nextExpiry, pushUndo, removeUndo, UNDO_WINDOW_MS, type UndoEntry } from "@/lib/undo/undoStack";
import { useToast } from "./useToast";

interface AnnounceOptions {
  // Aviso mostrado agora ("Catálogo salvo!").
  title: string;
  description?: string;
  // Nome curto da ação na lista de recentes ("Catálogo salvo").
  label: string;
  // Como voltar atrás.
  revert: () => Promise<void>;
}

interface UndoApi {
  // Ações que ainda podem ser desfeitas, da mais recente para a mais antiga.
  entries: UndoEntry[];
  // Mostra o aviso com o botão "Desfazer" e guarda a ação na lista de recentes.
  announce: (options: AnnounceOptions) => void;
  undo: (id: number) => Promise<void>;
}

const NOOP_API: UndoApi = { entries: [], announce: () => {}, undo: async () => {} };

const UndoContext = createContext<UndoApi>(NOOP_API);

// Ações recentes que podem ser desfeitas por um minuto: no aviso de cada ação e na lista do botão de ajuda.
export function UndoProvider({ children }: { children: ReactNode }) {
  const toast = useToast();
  const [stack, setStack] = useState<UndoEntry[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const counter = useRef(0);
  const stackRef = useRef(stack);
  stackRef.current = stack;

  const entries = useMemo(() => activeUndo(stack, now), [stack, now]);

  // A lista se atualiza sozinha quando a próxima ação perde o prazo.
  useEffect(() => {
    const expiry = nextExpiry(stack, now);
    if (expiry === null) return;
    const timer = setTimeout(() => setNow(Date.now()), Math.max(0, expiry - now) + 20);
    return () => clearTimeout(timer);
  }, [stack, now]);

  const undo = useCallback(
    async (id: number) => {
      const entry = stackRef.current.find((item) => item.id === id);
      if (!entry) return;
      // Sai da lista antes de rodar, para um segundo toque não desfazer duas vezes.
      setStack((current) => removeUndo(current, id));
      try {
        await entry.run();
        toast.show("info", "Desfeito!", entry.label);
      } catch {
        toast.show("error", "Não foi possível desfazer.", entry.label);
      }
    },
    [toast],
  );

  const announce = useCallback(
    ({ title, description, label, revert }: AnnounceOptions) => {
      counter.current += 1;
      const id = counter.current;
      const clock = Date.now();
      setNow(clock);
      setStack((current) => pushUndo(current, { id, label, run: revert, expiresAt: clock + UNDO_WINDOW_MS }));
      toast.show("success", title, description, { action: { label: "Desfazer", onPress: () => void undo(id) } });
    },
    [toast, undo],
  );

  const value = useMemo<UndoApi>(() => ({ entries, announce, undo }), [entries, announce, undo]);

  return <UndoContext.Provider value={value}>{children}</UndoContext.Provider>;
}

export function useUndo(): UndoApi {
  return useContext(UndoContext);
}
