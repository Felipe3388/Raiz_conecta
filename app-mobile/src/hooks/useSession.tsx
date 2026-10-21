import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getAuthService } from "@/services";
import type { AuthGateway } from "@/services";
import type { AuthUser } from "@/types/auth";

export type SessionState =
  { status: "loading" } | { status: "unauthenticated" } | { status: "authenticated"; user: AuthUser };

interface SessionContextValue {
  state: SessionState;
  signIn: (email: string, senha: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

interface SessionProviderProps {
  children: ReactNode;
  authService?: AuthGateway;
}

export function SessionProvider({ children, authService = getAuthService() }: SessionProviderProps) {
  const [state, setState] = useState<SessionState>({ status: "loading" });

  useEffect(() => {
    authService.restoreSession().then((user) => {
      setState(user ? { status: "authenticated", user } : { status: "unauthenticated" });
    });
  }, [authService]);

  const signIn = useCallback(
    async (email: string, senha: string) => {
      const user = await authService.login(email, senha);
      setState({ status: "authenticated", user });
    },
    [authService],
  );

  const signOut = useCallback(async () => {
    await authService.logout();
    setState({ status: "unauthenticated" });
  }, [authService]);

  const value = useMemo(() => ({ state, signIn, signOut }), [state, signIn, signOut]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) throw new Error("useSession deve ser usado dentro de SessionProvider.");
  return context;
}
