import { Redirect, Stack } from "expo-router";
import { StyleSheet, View } from "react-native";
import { AssistantHost } from "@/components/assistant/AssistantHost";
import { AssistantProvider } from "@/hooks/useAssistant";
import { DeliveriesProvider } from "@/hooks/useDeliveries";
import { ProducerIdentityProvider } from "@/hooks/useProducerIdentity";
import { PricingProvider } from "@/hooks/usePricing";
import { ProdutorDataProvider } from "@/hooks/useProdutorData";
import { useSession } from "@/hooks/useSession";
import { UndoProvider } from "@/hooks/useUndo";
import { colors } from "@/theme";

// Área do Produtor: as abas, mais Meu Perfil e Configurações que abrem por cima delas.
// O botão de ajuda mora aqui, acima de todas, para estar visível em qualquer tela.
export default function ProdutorLayout() {
  const { state } = useSession();

  if (state.status !== "authenticated") return <Redirect href="/login" />;

  return (
    <UndoProvider>
      <ProdutorDataProvider email={state.user.email}>
        <PricingProvider email={state.user.email}>
          <DeliveriesProvider email={state.user.email}>
            <ProducerIdentityProvider email={state.user.email}>
              <AssistantProvider>
                <View style={styles.root}>
                  <Stack
                    screenOptions={{
                      headerStyle: { backgroundColor: colors.surface },
                      headerTitleStyle: { fontWeight: "900", color: colors.text },
                      headerTintColor: colors.text,
                      contentStyle: { backgroundColor: colors.background },
                    }}
                  >
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    <Stack.Screen name="perfil" options={{ title: "Meu Perfil" }} />
                    <Stack.Screen name="configuracoes" options={{ title: "Configurações" }} />
                  </Stack>
                  <AssistantHost />
                </View>
              </AssistantProvider>
            </ProducerIdentityProvider>
          </DeliveriesProvider>
        </PricingProvider>
      </ProdutorDataProvider>
    </UndoProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
