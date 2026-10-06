import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "@/theme";
import { Button } from "./Button";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrapper}>{icon}</View>
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
      {actionLabel && onAction && (
        <View style={styles.action}>
          <Button label={actionLabel} onPress={onAction} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  iconWrapper: {
    backgroundColor: colors.primarySoft,
    padding: spacing.lg,
    borderRadius: radius.full,
    marginBottom: spacing.md,
  },
  title: { ...typography.heading, color: colors.text, textAlign: "center" },
  description: {
    ...typography.body,
    color: colors.textSubtle,
    textAlign: "center",
    marginTop: spacing.sm,
    maxWidth: 280,
  },
  action: { marginTop: spacing.lg },
});
