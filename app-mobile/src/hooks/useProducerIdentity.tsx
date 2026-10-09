import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { avatarFor, getSettingsStore, withAvatar } from "@/lib/settings";
import { initialsOf } from "@/lib/produtor/avatar";
import { getProfileService, type ProfileGateway } from "@/services";
import { useSettings } from "./useSettings";

interface ProducerIdentity {
  email: string;
  // Nome fantasia, ou o começo do e-mail enquanto o perfil carrega.
  name: string;
  initials: string;
  // Ícone escolhido no lugar das iniciais (null = usa as iniciais).
  emoji: string | null;
  setEmoji: (emoji: string | null) => void;
  // Avisa quando o nome muda no Meu Perfil, para o círculo do topo acompanhar.
  setName: (name: string) => void;
}

const ProducerIdentityContext = createContext<ProducerIdentity | null>(null);

interface ProviderProps {
  email: string;
  children: ReactNode;
  gateway?: ProfileGateway;
}

// Quem é o produtor na tela: nome, iniciais e o ícone que ele escolheu (guardado no aparelho, por conta).
export function ProducerIdentityProvider({ email, children, gateway = getProfileService() }: ProviderProps) {
  const { settings } = useSettings();
  const [profileName, setProfileName] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    gateway
      .getProfile(email)
      .then((profile) => {
        if (!cancelled) setProfileName(profile.nomeFantasia);
      })
      .catch(() => {
        // sem o nome, o círculo usa a inicial do e-mail
      });
    return () => {
      cancelled = true;
    };
  }, [gateway, email]);

  // Lê as configurações no momento da troca (e não as da última tela desenhada), para o "Desfazer" não
  // sobrescrever o que mudou nesse meio-tempo.
  const setEmoji = useCallback(
    (emoji: string | null) => {
      const store = getSettingsStore();
      void store.update({ avatars: withAvatar(store.get(), email, emoji).avatars });
    },
    [email],
  );

  const value = useMemo<ProducerIdentity>(() => {
    const name = profileName?.trim() ? profileName : email.split("@")[0];
    return {
      email,
      name,
      initials: initialsOf(name),
      emoji: avatarFor(settings, email),
      setEmoji,
      setName: setProfileName,
    };
  }, [email, profileName, settings, setEmoji]);

  return <ProducerIdentityContext.Provider value={value}>{children}</ProducerIdentityContext.Provider>;
}

export function useProducerIdentity(): ProducerIdentity {
  const context = useContext(ProducerIdentityContext);
  if (!context) throw new Error("useProducerIdentity deve ser usado dentro de ProducerIdentityProvider.");
  return context;
}
