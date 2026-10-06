import { Ionicons } from "@expo/vector-icons";
import { EmptyState } from "@/components/ui/EmptyState";
import { Screen } from "@/components/ui/Screen";
import { colors } from "@/theme";

// SCRUM-28 e SCRUM-29: histórico de ofertas e foto de saída.
export default function OfertasScreen() {
  return (
    <Screen>
      <EmptyState
        icon={<Ionicons name="checkmark-done-outline" size={40} color={colors.primary} />}
        title="Ofertas Fechadas"
        description="Tela em construção."
      />
    </Screen>
  );
}
