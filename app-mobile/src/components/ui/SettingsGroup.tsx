import { Children, Fragment, type ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, elevation, radius, spacing, typography } from "@/theme";

interface SettingsGroupProps {
  // Rótulo pequeno acima do grupo (como nos Ajustes do iPhone).
  title?: string;
  // Explicação em letra menor logo abaixo do grupo.
  footer?: string;
  children: ReactNode;
}

// Um grupo de linhas num cartão só, separadas por um fio fino que começa depois do ícone (lista agrupada do iOS).
export function SettingsGroup({ title, footer, children }: SettingsGroupProps) {
  const rows = Children.toArray(children);

  return (
    <View style={styles.group}>
      {title && (
        <Text accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
      )}
      <View style={styles.card}>
        {rows.map((row, index) => (
          <Fragment key={index}>
            {index > 0 && <View style={styles.separator} />}
            <View style={styles.row}>{row}</View>
          </Fragment>
        ))}
      </View>
      {footer && <Text style={styles.footer}>{footer}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.sm },
  title: { ...typography.sectionHeader, color: colors.textMuted, paddingHorizontal: spacing.md },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, boxShadow: elevation.card, overflow: "hidden" },
  row: { paddingHorizontal: spacing.md },
  // Começa depois do ícone (16 de margem + 36 do ícone + 12 de espaço).
  separator: { height: 1, marginLeft: spacing.md + 36 + spacing.sm + 4, backgroundColor: colors.borderMid },
  footer: { ...typography.hint, color: colors.textMuted, paddingHorizontal: spacing.md },
});
