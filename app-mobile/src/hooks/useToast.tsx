import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ToastBanner, type ToastAction, type ToastData, type ToastTone } from "@/components/ui/ToastBanner";

const VISIBLE_MS = 3800;
// Um aviso com botão (ex.: "Desfazer") fica mais tempo, para dar tempo de tocar.
const ACTION_VISIBLE_MS = 8000;

interface ToastOptions {
  // Botão no aviso. Tocar nele também fecha o aviso.
  action?: ToastAction;
}

interface ToastApi {
  show: (tone: ToastTone, title: string, description?: string, options?: ToastOptions) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

// Avisos rápidos no topo da tela ("Catálogo salvo!", "Erro de conexão."), como o sonner do site.
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastData | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const counter = useRef(0);

  const dismiss = useCallback(() => setToast(null), []);

  const show = useCallback((tone: ToastTone, title: string, description?: string, options?: ToastOptions) => {
    if (timer.current) clearTimeout(timer.current);
    counter.current += 1;
    setToast({ id: counter.current, tone, title, description, action: options?.action });
    timer.current = setTimeout(() => setToast(null), options?.action ? ACTION_VISIBLE_MS : VISIBLE_MS);
  }, []);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const api = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastBanner toast={toast} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast deve ser usado dentro de ToastProvider.");
  return context;
}
