import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, elevation, radius, spacing, typography } from "@/theme";
import { Button } from "./Button";

interface AlertModalProps {
  visible: boolean;
  title: string;
  message: string;
  button: string;
  onClose: () => void;
}

// Aviso no meio da tela com um só botão: diz o que aconteceu e o que fazer, sem pedir uma decisão.
export function AlertModal({ visible, title, message, button, onClose }: AlertModalProps) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable accessibilityLabel={button} style={StyleSheet.absoluteFill} onPress={onClose} />
        <View accessibilityViewIsModal accessibilityRole="alert" style={styles.card}>
          <View style={styles.icon}>
            <Ionicons name="alert-circle-outline" size={34} color={colors.warningStrong} />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <Button label={button} size="lg" variant="amber" onPress={onClose} />
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
    gap: spacing.md,
    alignItems: "stretch",
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    boxShadow: elevation.raised,
  },
  icon: {
    alignSelf: "center",
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.full,
    backgroundColor: colors.warningSoft,
  },
  title: { ...typography.heading, textAlign: "center", color: colors.text },
  message: { ...typography.body, textAlign: "center", color: colors.textMuted },
});
