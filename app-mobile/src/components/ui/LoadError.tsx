import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/theme";
import { EmptyState } from "./EmptyState";
import { Screen } from "./Screen";

// Tela de erro de carregamento, com botão para tentar de novo.
export function LoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <Screen>
      <EmptyState
        icon={<Ionicons name="cloud-offline-outline" size={40} color={colors.danger} />}
        title="Não deu para carregar"
        description="Verifique sua conexão e tente de novo."
        actionLabel="Tentar de novo"
        onAction={onRetry}
      />
    </Screen>
  );
}
