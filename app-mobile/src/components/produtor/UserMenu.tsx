import { Ionicons } from "@expo/vector-icons";
import { Animated, Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { PressableScale } from "@/components/motion/PressableScale";
import { usePresence } from "@/components/motion/usePresence";
import { USER_MENU_ITEMS, type UserMenuItemId } from "@/content/userMenu";
import { useProducerIdentity } from "@/hooks/useProducerIdentity";
import { colors, radius, spacing, typography } from "@/theme";
import { UserAvatar } from "./UserAvatar";

export interface MenuAnchor {
  // Parte de baixo do botão que abriu o menu, em pixels da janela.
  bottom: number;
}

interface UserMenuProps {
  visible: boolean;
  anchor: MenuAnchor;
  onClose: () => void;
  onSelect: (id: UserMenuItemId) => void;
}

const MENU_WIDTH = 270;
const EDGE = spacing.sm + 4;

// Menu suspenso do usuário: abre embaixo do ícone da conta, sobre a tela, e fecha ao tocar fora.
export function UserMenu({ visible, anchor, onClose, onSelect }: UserMenuProps) {
  const { name, email, initials, emoji } = useProducerIdentity();
  const { width } = useWindowDimensions();
  const { mounted, progress } = usePresence(visible, 160);

  return (
    <Modal transparent statusBarTranslucent visible={mounted} animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable accessibilityRole="button" accessibilityLabel="Fechar menu" style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View
          accessibilityViewIsModal
          style={[
            styles.menu,
            {
              top: anchor.bottom + 6,
              width: Math.min(MENU_WIDTH, width - EDGE * 2),
              opacity: progress,
              transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) }],
            },
          ]}
        >
          <View style={styles.identity}>
            <UserAvatar initials={initials} emoji={emoji} size={44} />
            <View style={styles.identityText}>
              <Text style={styles.name} numberOfLines={1}>
                {name}
              </Text>
              <Text style={styles.email} numberOfLines={1}>
                {email}
              </Text>
            </View>
          </View>

          {USER_MENU_ITEMS.map((item) => {
            const danger = item.tone === "danger";
            return (
              <View key={item.id}>
                {danger && <View style={styles.divider} />}
                <PressableScale
                  accessibilityRole="button"
                  accessibilityLabel={item.label}
                  onPress={() => onSelect(item.id)}
                  pressedScale={0.98}
                  style={({ pressed }) => [styles.item, pressed && (danger ? styles.itemDangerPressed : styles.itemPressed)]}
                >
                  <Ionicons name={item.icon} size={22} color={danger ? colors.danger : colors.textStrong} />
                  <Text style={[styles.itemLabel, danger && styles.itemLabelDanger]}>{item.label}</Text>
                </PressableScale>
              </View>
            );
          })}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(17, 24, 39, 0.25)" },
  menu: {
    position: "absolute",
    right: EDGE,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderMid,
    boxShadow: "0px 8px 24px rgba(0, 0, 0, 0.2)",
  },
  identity: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm + 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    marginBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  identityText: { flex: 1, gap: 2 },
  name: { ...typography.label, color: colors.text },
  email: { ...typography.caption, color: colors.textMuted },
  divider: { height: 1, marginVertical: spacing.xs, backgroundColor: colors.border },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm + 4,
    minHeight: 48,
    paddingHorizontal: spacing.md,
  },
  itemPressed: { backgroundColor: colors.ghostPressed },
  itemDangerPressed: { backgroundColor: colors.dangerSoft },
  itemLabel: { ...typography.button, color: colors.textStrong },
  itemLabelDanger: { color: colors.danger },
});
