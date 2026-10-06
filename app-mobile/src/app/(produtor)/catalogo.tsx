import { Ionicons } from "@expo/vector-icons";
import { EmptyState } from "@/components/ui/EmptyState";
import { Screen } from "@/components/ui/Screen";
import { colors } from "@/theme";

// SCRUM-25 a SCRUM-27: seleção de produtos e preço sugerido.
export default function CatalogoScreen() {
  return (
    <Screen>
      <EmptyState
        icon={<Ionicons name="leaf-outline" size={40} color={colors.primary} />}
        title="Meu Catálogo"
        description="Tela em construção."
      />
    </Screen>
  );
}
