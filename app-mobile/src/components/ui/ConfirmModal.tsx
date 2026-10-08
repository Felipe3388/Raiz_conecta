import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "@/theme";
import { Button } from "./Button";

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  // "danger" para ações sem volta, como excluir a conta.
  variant?: "success" | "danger";
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

// Pergunta de confirmação no meio da tela, antes de salvar ou apagar algo importante.
export function ConfirmModal({
  visible,
  title,
  description,
  confirmLabel,
  cancelLabel,
  variant = "success",
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const isDanger = variant === "danger";

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <Pressable accessibilityLabel={cancelLabel} style={StyleSheet.absoluteFill} onPress={onCancel} />
        <View style={styles.card} accessibilityViewIsModal>
          <View style={[styles.icon, isDanger ? styles.iconDanger : styles.iconSuccess]}>
            <Ionicons
              name={isDanger ? "warning-outline" : "checkmark-circle-outline"}
              size={34}
              color={isDanger ? colors.danger : colors.primary}
            />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
          <View style={styles.actions}>
            <Button
              label={confirmLabel}
              variant={isDanger ? "danger" : "primary"}
              size="lg"
              isLoading={isLoading}
              onPress={onConfirm}
            />
            <Button label={cancelLabel} variant="ghost" disabled={isLoading} onPress={onCancel} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
    backgroundColor: "rgba(17, 24, 39, 0.6)",
  },
  card: {
    width: "100%",
    maxWidth: 420,
    alignItems: "center",
    gap: spacing.sm + 4,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg + 4,
  },
  icon: { padding: spacing.md, borderRadius: radius.full },
  iconSuccess: { backgroundColor: colors.primarySoft },
  iconDanger: { backgroundColor: colors.dangerSoft },
  title: { ...typography.heading, color: colors.text, textAlign: "center" },
  description: { ...typography.body, color: colors.textMuted, textAlign: "center", lineHeight: 23 },
  actions: { alignSelf: "stretch", gap: spacing.xs, marginTop: spacing.sm },
});
