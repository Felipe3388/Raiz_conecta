import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import type { ColorValue } from "react-native";
import { HeaderLogoutButton } from "@/components/HeaderLogoutButton";
import { useSession } from "@/hooks/useSession";
import { colors } from "@/theme";

type IconName = keyof typeof Ionicons.glyphMap;

function tabIcon(name: IconName) {
  return function TabIcon({ color, size }: { color: ColorValue; size: number }) {
    return <Ionicons name={name} size={size} color={color} />;
  };
}

export default function ProdutorLayout() {
  const { state } = useSession();

  if (state.status !== "authenticated") return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSubtle,
        headerTitleStyle: { fontWeight: "900", color: colors.text },
        headerRight: () => <HeaderLogoutButton />,
      }}
    >
      <Tabs.Screen
        name="mural"
        options={{
          title: "Mural de Oportunidades",
          tabBarLabel: "Mural",
          tabBarIcon: tabIcon("grid-outline"),
        }}
      />
      <Tabs.Screen
        name="catalogo"
        options={{
          title: "Meu Catálogo",
          tabBarIcon: tabIcon("leaf-outline"),
        }}
      />
      <Tabs.Screen
        name="ofertas"
        options={{
          title: "Ofertas Fechadas",
          tabBarLabel: "Ofertas",
          tabBarIcon: tabIcon("checkmark-done-outline"),
        }}
      />
    </Tabs>
  );
}
