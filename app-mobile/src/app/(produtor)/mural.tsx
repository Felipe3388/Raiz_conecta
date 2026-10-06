import { Ionicons } from "@expo/vector-icons";
import { EmptyState } from "@/components/ui/EmptyState";
import { Screen } from "@/components/ui/Screen";
import { colors } from "@/theme";

// SCRUM-23 e SCRUM-24: listagem de demandas e registro de oferta.
export default function MuralScreen() {
  return (
    <Screen>
      <EmptyState
        icon={<Ionicons name="grid-outline" size={40} color={colors.primary} />}
        title="Mural de Oportunidades"
        description="Tela em construção."
      />
    </Screen>
  );
}
