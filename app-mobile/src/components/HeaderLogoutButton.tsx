import { Ionicons } from "@expo/vector-icons";
import { Pressable } from "react-native";
import { useSession } from "@/hooks/useSession";
import { colors, spacing } from "@/theme";

export function HeaderLogoutButton() {
  const { signOut } = useSession();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Sair"
      hitSlop={8}
      onPress={signOut}
      style={{ marginRight: spacing.md }}
    >
      <Ionicons name="log-out-outline" size={24} color={colors.textMuted} />
    </Pressable>
  );
}
