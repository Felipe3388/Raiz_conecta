import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import type { ColorValue } from "react-native";
import { HeaderBrand } from "@/components/produtor/HeaderBrand";
import { ProducerTabBar } from "@/components/produtor/ProducerTabBar";
import { UserMenuButton } from "@/components/produtor/UserMenuButton";
import { useDeliveries } from "@/hooks/useDeliveries";
import { useProdutorData } from "@/hooks/useProdutorData";
import { HOME_ROUTE } from "@/lib/produtor/tabs";
import { colors } from "@/theme";
import type { IconName } from "@/types/icon";

function tabIcon(name: IconName) {
  return function TabIcon({ color, size }: { color: ColorValue; size: number }) {
    return <Ionicons name={name} size={size} color={color} />;
  };
}

// As quatro abas do Produtor (Mural, Catálogo, Ofertas, Entregas) e, no meio da barra, o botão redondo Início, que
// leva ao Painel: a tela em que o app abre depois do login. O ícone da conta, no canto do cabeçalho, leva ao perfil
// e às configurações.
export default function TabsLayout() {
  const { status, mural } = useProdutorData();
  const { pending } = useDeliveries();

  return (
    <Tabs
      initialRouteName={HOME_ROUTE}
      // Voltar de qualquer aba leva ao Painel, a tela inicial.
      backBehavior="initialRoute"
      tabBar={(props) => <ProducerTabBar {...props} />}
      screenOptions={{
        headerTitle: () => <HeaderBrand />,
        headerTitleAlign: "left",
        headerRight: () => <UserMenuButton />,
        headerStyle: { backgroundColor: colors.surface },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen
        name="mural"
        options={{
          title: "Mural",
          tabBarIcon: tabIcon("grid-outline"),
          // Quantos pedidos esperam resposta; some enquanto carrega ou quando não há nenhum.
          tabBarBadge: status === "ready" && mural.length > 0 ? mural.length : undefined,
          tabBarAccessibilityLabel:
            status === "ready" && mural.length > 0 ? `Mural, ${mural.length} pedidos abertos` : "Mural",
        }}
      />
      <Tabs.Screen name="catalogo" options={{ title: "Catálogo", tabBarIcon: tabIcon("nutrition-outline") }} />
      {/* O Painel fica no meio da ordem: a barra põe o botão Início entre a 2ª e a 3ª aba. */}
      <Tabs.Screen name="painel" options={{ title: "Início", tabBarIcon: tabIcon("stats-chart-outline") }} />
      <Tabs.Screen name="ofertas" options={{ title: "Ofertas", tabBarIcon: tabIcon("checkmark-done-outline") }} />
      <Tabs.Screen
        name="entregas"
        options={{
          title: "Entregas",
          tabBarIcon: tabIcon("cube-outline"),
          // Quantas entregas pedem ação hoje; some quando não há nenhuma.
          tabBarBadge: pending > 0 ? pending : undefined,
          tabBarAccessibilityLabel: pending > 0 ? `Entregas, ${pending} para fazer hoje` : "Entregas",
        }}
      />
    </Tabs>
  );
}
