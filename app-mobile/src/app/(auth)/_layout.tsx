import { Redirect, Stack } from "expo-router";
import { RegistrationProvider } from "@/hooks/useRegistration";
import { useSession } from "@/hooks/useSession";

export default function AuthLayout() {
  const { state } = useSession();

  if (state.status === "authenticated") return <Redirect href="/mural" />;

  return (
    <RegistrationProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </RegistrationProvider>
  );
}
