import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { emptyAccount, emptyProfile } from "@/lib/registration/draft";
import type { AccountFields, ProfileFields } from "@/types/registration";

// Guarda os dados do cadastro entre os dois passos, só em memória (a senha nunca é salva em disco).
interface RegistrationDraft {
  account: AccountFields;
  profile: ProfileFields;
  updateAccount: (patch: Partial<AccountFields>) => void;
  updateProfile: (patch: Partial<ProfileFields>) => void;
  reset: () => void;
}

const RegistrationContext = createContext<RegistrationDraft | null>(null);

export function RegistrationProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState(emptyAccount);
  const [profile, setProfile] = useState(emptyProfile);

  const updateAccount = useCallback(
    (patch: Partial<AccountFields>) => setAccount((current) => ({ ...current, ...patch })),
    [],
  );
  const updateProfile = useCallback(
    (patch: Partial<ProfileFields>) => setProfile((current) => ({ ...current, ...patch })),
    [],
  );
  const reset = useCallback(() => {
    setAccount(emptyAccount());
    setProfile(emptyProfile());
  }, []);

  const value = useMemo(
    () => ({ account, profile, updateAccount, updateProfile, reset }),
    [account, profile, updateAccount, updateProfile, reset],
  );

  return <RegistrationContext.Provider value={value}>{children}</RegistrationContext.Provider>;
}

export function useRegistrationDraft(): RegistrationDraft {
  const context = useContext(RegistrationContext);
  if (!context) {
    throw new Error("useRegistrationDraft deve ser usado dentro de RegistrationProvider.");
  }
  return context;
}
