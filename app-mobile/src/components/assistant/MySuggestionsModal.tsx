import { BrandMark } from "@/components/brand/BrandMark";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { SuggestionItem } from "@/components/produtor/SuggestionItem";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { useMySuggestions } from "@/hooks/useMySuggestions";
import { colors, radius, spacing, typography } from "@/theme";

interface MySuggestionsModalProps {
  visible: boolean;
  onClose: () => void;
  onSuggest: () => void;
}

// Minhas sugestões: os produtos que o produtor pediu para entrar no catálogo e a situação de cada um.
export function MySuggestionsModal({ visible, onClose, onSuggest }: MySuggestionsModalProps) {
  const { status, items, reload } = useMySuggestions(visible);

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      icon="list-outline"
      title="Minhas sugestões"
      subtitle="Acompanhe os produtos que você sugeriu"
      footer={<Button label="Sugerir um produto" variant="amber" onPress={onSuggest} />}
    >
      {status === "loading" && (
        <View style={styles.center} accessibilityLabel="Carregando">
          <ActivityIndicator color={colors.primary} />
        </View>
      )}

      {status === "error" && (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={32} color={colors.danger} />
          <Text style={styles.message}>Não deu para carregar as sugestões.</Text>
          <Button label="Tentar de novo" variant="outline" size="sm" onPress={reload} />
        </View>
      )}

      {status === "ready" && items.length === 0 && (
        <View style={styles.center}>
          <View style={styles.emptyIcon}>
            <BrandMark size={34} color={colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>Você ainda não sugeriu nenhum produto</Text>
          <Text style={styles.message}>
            Não achou o que planta no catálogo? Envie uma sugestão e nossa equipe avalia.
          </Text>
        </View>
      )}

      {status === "ready" && items.length > 0 && (
        <ScrollView contentContainerStyle={styles.list}>
          {items.map((suggestion) => (
            <SuggestionItem key={suggestion.id} suggestion={suggestion} />
          ))}
        </ScrollView>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm + 4, padding: spacing.md },
  center: { alignItems: "center", justifyContent: "center", gap: spacing.sm + 4, padding: spacing.lg, minHeight: 220 },
  emptyIcon: { padding: spacing.md, borderRadius: radius.full, backgroundColor: colors.primarySoft },
  emptyTitle: { ...typography.label, color: colors.text, textAlign: "center" },
  message: { ...typography.body, color: colors.textMuted, textAlign: "center" },
});
