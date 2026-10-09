import { Ionicons } from "@expo/vector-icons";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { useUndo } from "@/hooks/useUndo";
import { colors, radius, spacing, typography } from "@/theme";

interface UndoSheetProps {
  visible: boolean;
  onClose: () => void;
}

// As ações recentes que ainda dá para desfazer, da mais nova para a mais antiga.
export function UndoSheet({ visible, onClose }: UndoSheetProps) {
  const { entries, undo } = useUndo();

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      icon="arrow-undo-outline"
      title="Desfazer ações recentes"
      subtitle="Você tem um minuto para voltar atrás."
    >
      <ScrollView contentContainerStyle={styles.list}>
        {entries.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="checkmark-done-outline" size={36} color={colors.primary} />
            <Text style={styles.emptyText}>Nada para desfazer agora.</Text>
          </View>
        ) : (
          entries.map((entry, index) => (
            <View key={entry.id} style={styles.row}>
              <View style={styles.text}>
                <Text style={styles.label}>{entry.label}</Text>
                {index === 0 && <Text style={styles.hint}>Mais recente</Text>}
              </View>
              <Button label="Desfazer" variant="amberOutline" size="sm" onPress={() => void undo(entry.id)} />
            </View>
          ))
        )}
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.md, gap: spacing.sm },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.borderMid,
    borderRadius: radius.md,
  },
  text: { flex: 1, gap: 2 },
  label: { ...typography.label, color: colors.text },
  hint: { ...typography.hint, color: colors.textMuted },
  empty: { alignItems: "center", gap: spacing.sm, padding: spacing.lg },
  emptyText: { ...typography.body, color: colors.textMuted },
});
