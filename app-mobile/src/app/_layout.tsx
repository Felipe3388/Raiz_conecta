import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { PageLoader } from "@/components/ui/PageLoader";
import { SessionProvider, useSession } from "@/hooks/useSession";
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
  return (
    <SessionProvider>
      <StatusBar style="dark" />
      <RootNavigator />
    </SessionProvider>
  );
}
