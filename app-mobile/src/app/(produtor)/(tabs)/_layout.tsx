import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import type { ColorValue } from "react-native";
import { HeaderBrand } from "@/components/produtor/HeaderBrand";
import { ProducerTabBar } from "@/components/produtor/ProducerTabBar";
import { UserMenuButton } from "@/components/produtor/UserMenuButton";
import { useDeliveries } from "@/hooks/useDeliveries";
import { useNow } from "@/hooks/useNow";
import { useProdutorData } from "@/hooks/useProdutorData";
import { proposalCounts } from "@/lib/produtor/proposals";
import { badgeLabel, HOME_ROUTE } from "@/lib/produtor/tabs";
import { colors } from "@/theme";
import type { IconName } from "@/types/icon";

// Contorno quando a aba está parada e símbolo cheio quando ela está aberta, como nas barras de abas do iOS.
function tabIcon(outline: IconName, filled: IconName) {
  return function TabIcon({ color, size, focused }: { color: ColorValue; size: number; focused: boolean }) {
    return <Ionicons name={focused ? filled : outline} size={size} color={color} />;
  };
}

// As quatro abas do Produtor (Catálogo e Ofertas à esquerda; Entregas e Mais à direita) e, no meio da barra, o botão
// redondo Início, que leva ao Painel: a tela em que o app abre depois do login. O ícone da conta, no canto do
// cabeçalho, leva ao perfil e à saída; o resto (configurações, privacidade, balança, ajuda) fica na aba Mais.
export default function TabsLayout() {
  const { status, proposals } = useProdutorData();
  const { pending } = useDeliveries();
  // Propostas esperando resposta: o relógio corre só enquanto há alguma, para o número cair quando o prazo acabar.
  const now = useNow(
    proposals.some((proposal) => proposal.status === "PENDENTE"),
    5000,
  );
  const waiting = status === "ready" ? proposalCounts(proposals, now).pending : 0;

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
        name="catalogo"
        options={{ title: "Catálogo", tabBarIcon: tabIcon("nutrition-outline", "nutrition") }}
      />
      <Tabs.Screen
        name="ofertas"
        options={{
          title: "Ofertas",
          tabBarIcon: tabIcon("checkmark-done-outline", "checkmark-done-circle"),
          // Quantos pedidos esperam resposta; some enquanto carrega ou quando não há nenhuma.
          tabBarBadge: waiting > 0 ? waiting : undefined,
          tabBarAccessibilityLabel: badgeLabel("Ofertas", waiting, "pedido para responder", "pedidos para responder"),
        }}
      />
      {/* O Painel fica no meio da ordem: a barra põe o botão Início entre a 2ª e a 3ª aba. */}
      <Tabs.Screen
        name="painel"
        options={{ title: "Início", tabBarIcon: tabIcon("stats-chart-outline", "stats-chart") }}
      />
      <Tabs.Screen
        name="entregas"
        options={{
          title: "Entregas",
          tabBarIcon: tabIcon("cube-outline", "cube"),
          // Quantos pedidos pedem ação até o próximo dia de entrega; some quando não há nenhum.
          tabBarBadge: pending > 0 ? pending : undefined,
          tabBarAccessibilityLabel: badgeLabel(
            "Entregas",
            pending,
            "pedido para a próxima entrega",
            "pedidos para a próxima entrega",
          ),
        }}
      />
      <Tabs.Screen
        name="mais"
        options={{
          title: "Mais",
          tabBarIcon: tabIcon("ellipsis-horizontal-circle-outline", "ellipsis-horizontal-circle"),
        }}
      />
    </Tabs>
  );
}
