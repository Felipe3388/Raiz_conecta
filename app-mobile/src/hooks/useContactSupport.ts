import { SUPPORT_SOON_DESCRIPTION, SUPPORT_SOON_TITLE } from "@/content/support";
import { useToast } from "./useToast";

// "Falar com Suporte": por enquanto avisa que o chat chega em breve e mostra o e-mail.
export function useContactSupport() {
  const toast = useToast();
  return () => toast.show("info", SUPPORT_SOON_TITLE, SUPPORT_SOON_DESCRIPTION);
}
