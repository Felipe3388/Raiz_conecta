import { Stack } from "expo-router";
import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { PageLoader } from "@/components/ui/PageLoader";
import { SessionProvider, useSession } from "@/hooks/useSession";
import { ToastProvider } from "@/hooks/useToast";
import { getSettingsStore } from "@/lib/settings";
import { colors } from "@/theme";

function RootNavigator() {
  const { state } = useSession();

  if (state.status === "loading") return <PageLoader />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}

export default function RootLayout() {
  // Traz as configurações salvas (ex.: "Reduzir animações") assim que o app abre.
  useEffect(() => {
    getSettingsStore().load();
  }, []);

  return (
    <SessionProvider>
      <ToastProvider>
        <StatusBar style="dark" />
        <RootNavigator />
      </ToastProvider>
    </SessionProvider>
  );
}
