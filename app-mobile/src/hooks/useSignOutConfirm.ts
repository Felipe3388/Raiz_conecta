import { useState } from "react";
import { useSession } from "./useSession";

// "Sair da conta" com confirmação, para ninguém sair sem querer. Usado no menu do usuário e nas Configurações.
export function useSignOutConfirm() {
  const { signOut } = useSession();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function confirm() {
    setIsSigningOut(true);
    try {
      await signOut();
    } finally {
      setIsSigningOut(false);
      setIsConfirming(false);
    }
  }

  return {
    isConfirming,
    isSigningOut,
    request: () => setIsConfirming(true),
    confirm,
    cancel: () => setIsConfirming(false),
  };
}
