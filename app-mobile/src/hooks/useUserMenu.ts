import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import type { View } from "react-native";
import type { UserMenuItemId } from "@/content/userMenu";
import { useSignOutConfirm } from "./useSignOutConfirm";

// Altura aproximada do cabeçalho, usada só se o aparelho não souber dizer onde o botão está.
const FALLBACK_BOTTOM = 96;

// Controller do menu do usuário: abre embaixo do ícone, leva às telas e pede confirmação para sair.
export function useUserMenu() {
  const router = useRouter();
  const buttonRef = useRef<View>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [bottom, setBottom] = useState(FALLBACK_BOTTOM);
  const signOut = useSignOutConfirm();

  function open() {
    // Mede onde o ícone está para o menu abrir logo abaixo dele, em qualquer aparelho.
    buttonRef.current?.measureInWindow((_x, y, _width, height) => {
      if (height > 0) setBottom(y + height);
      setIsOpen(true);
    });
    if (!buttonRef.current) setIsOpen(true);
  }

  const close = () => setIsOpen(false);

  // Strategy por tabela: cada item do menu sabe o que fazer.
  const handlers: Record<UserMenuItemId, () => void> = {
    profile: () => router.push("/perfil"),
    signOut: signOut.request,
  };

  function select(id: UserMenuItemId) {
    close();
    handlers[id]();
  }

  return {
    buttonRef,
    isOpen,
    anchor: { bottom },
    open,
    close,
    select,
    isConfirmingSignOut: signOut.isConfirming,
    isSigningOut: signOut.isSigningOut,
    confirmSignOut: signOut.confirm,
    cancelSignOut: signOut.cancel,
  };
}
