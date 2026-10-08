import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "@/theme";

interface LockedFieldProps {
  label: string;
  value: string;
}

// Campo só de leitura (e-mail e documento): aparece com cadeado, como no perfil do site.
export function LockedField({ label, value }: LockedFieldProps) {
  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        <Ionicons name="lock-closed" size={13} color={colors.textMuted} />
      </View>
      <View style={styles.box}>
        <Text style={styles.value} numberOfLines={1}>
          {value || "Não informado"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  labelRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  label: { ...typography.hint, fontWeight: "700", color: colors.textMuted },
  box: {
    minHeight: 52,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    backgroundColor: colors.border,
    borderWidth: 1,
    borderColor: colors.borderMid,
    borderRadius: radius.md,
  },
  value: { ...typography.input, color: colors.textSubtle },
});
