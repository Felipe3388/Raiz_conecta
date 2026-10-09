import { Redirect, Stack } from "expo-router";
import { ScreenTransition } from "@/components/motion/ScreenTransition";
import type { AuthScreenName } from "@/components/motion/screenTransition";
import { RegistrationProvider } from "@/hooks/useRegistration";
import { useSession } from "@/hooks/useSession";
import { colors } from "@/theme";

export default function AuthLayout() {
  const { state } = useSession();

  if (state.status === "authenticated") return <Redirect href="/painel" />;

  return (
    <RegistrationProvider>
      <Stack
        // Cada tela do fluxo entra do lado certo: da direita ao avançar, da esquerda ao voltar.
        screenLayout={({ route, children }) => (
          <ScreenTransition screen={route.name as AuthScreenName}>{children}</ScreenTransition>
        )}
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
          animationTypeForReplace: "pop",
          contentStyle: { backgroundColor: colors.background },
        }}
      />
    </RegistrationProvider>
  );
}
