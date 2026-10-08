import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import type { ColorValue } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HeaderBrand } from "@/components/produtor/HeaderBrand";
import { TAB_BAR_CONTENT_HEIGHT } from "@/components/produtor/tabBar";
import { UserMenuButton } from "@/components/produtor/UserMenuButton";
import { useProdutorData } from "@/hooks/useProdutorData";
import { colors } from "@/theme";

type IconName = keyof typeof Ionicons.glyphMap;

function tabIcon(name: IconName) {
  return function TabIcon({ color, size }: { color: ColorValue; size: number }) {
    return <Ionicons name={name} size={size} color={color} />;
  };
}

// As quatro abas do Produtor. O ícone da conta, no canto do cabeçalho, leva ao perfil e às configurações.
export default function TabsLayout() {
  const { status, mural } = useProdutorData();
  const { bottom } = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSubtle,
        tabBarLabelStyle: { fontSize: 13, fontWeight: "700" },
        // A altura inclui a área segura do aparelho.
        tabBarStyle: {
          height: TAB_BAR_CONTENT_HEIGHT + bottom,
          paddingTop: 6,
          paddingBottom: bottom + 6,
          backgroundColor: colors.surface,
        },
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
        }}
      />
      <Tabs.Screen name="catalogo" options={{ title: "Catálogo", tabBarIcon: tabIcon("leaf-outline") }} />
      <Tabs.Screen name="ofertas" options={{ title: "Ofertas", tabBarIcon: tabIcon("checkmark-done-outline") }} />
      <Tabs.Screen name="painel" options={{ title: "Painel", tabBarIcon: tabIcon("stats-chart-outline") }} />
    </Tabs>
  );
}
