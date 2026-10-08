import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type AssistantModal = "help" | "suggest" | "mySuggestions";

interface AssistantApi {
  // Janela aberta pelo botão flutuante (só uma por vez).
  modal: AssistantModal | null;
  open: (modal: AssistantModal) => void;
  close: () => void;
  // Botão escondido na lateral da tela.
  tucked: boolean;
  setTucked: (tucked: boolean) => void;
  // Quanto o botão sobe para não cobrir uma barra fixa da tela (ex.: "Salvar Escolhas").
  lift: number;
  registerLift: (height: number) => () => void;
}

const NOOP_API: AssistantApi = {
  modal: null,
  open: () => {},
  close: () => {},
  tucked: false,
  setTucked: () => {},
  lift: 0,
  registerLift: () => () => {},
};

const AssistantContext = createContext<AssistantApi>(NOOP_API);

// Estado do botão flutuante de ajuda, que vive acima de todas as telas do Produtor.
export function AssistantProvider({ children }: { children: ReactNode }) {
  const [modal, setModal] = useState<AssistantModal | null>(null);
  const [tucked, setTucked] = useState(false);
  const [lifts, setLifts] = useState<number[]>([]);

  const registerLift = useCallback((height: number) => {
    setLifts((current) => [...current, height]);
    return () =>
      setLifts((current) => {
        const index = current.indexOf(height);
        return index < 0 ? current : [...current.slice(0, index), ...current.slice(index + 1)];
      });
  }, []);

  const value = useMemo<AssistantApi>(
    () => ({
      modal,
      open: setModal,
      close: () => setModal(null),
      tucked,
      setTucked,
      lift: Math.max(0, ...lifts),
      registerLift,
    }),
    [modal, tucked, lifts, registerLift],
  );

  return <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>;
}

export function useAssistant(): AssistantApi {
  return useContext(AssistantContext);
}

// Uma barra fixa que ocupa `height` px no fim da tela avisa o botão de ajuda para subir enquanto ela existir.
export function useFabLift(height: number) {
  const { registerLift } = useAssistant();
  useEffect(() => registerLift(height), [registerLift, height]);
}
