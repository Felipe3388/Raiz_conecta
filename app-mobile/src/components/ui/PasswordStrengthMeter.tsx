import { StyleSheet, Text, View } from "react-native";
import { passwordStrength } from "@/lib/auth/password";
import { colors, radius, spacing, typography } from "@/theme";

const BARS = [1, 2, 3, 4, 5];
const STRONG_ENOUGH = 4;

export function PasswordStrengthMeter({ password }: { password: string }) {
  const { score, label } = passwordStrength(password);
  const color = colors.strength[Math.max(0, score - 1)];

  return (
    <View style={styles.container}>
      <View style={styles.bars}>
        {BARS.map((bar) => (
          <View
            key={bar}
            style={[styles.bar, { backgroundColor: bar <= score ? color : colors.border }]}
          />
        ))}
      </View>
      <Text style={[styles.label, { color }]}>{label}</Text>
      {score < STRONG_ENOUGH && (
        <Text style={styles.hint}>Use maiúsculas, números e símbolos (!@#$%)</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  bars: { flexDirection: "row", gap: spacing.xs },
  bar: { flex: 1, height: 6, borderRadius: radius.full },
  label: { ...typography.caption, fontWeight: "700" },
  hint: { ...typography.caption, color: colors.textSubtle },
});
