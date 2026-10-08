import { StyleSheet, Text, View } from "react-native";
import { colors, radius } from "@/theme";

interface UserAvatarProps {
  initials: string;
  // Ícone escolhido pelo produtor; sem ele, aparecem as iniciais.
  emoji: string | null;
  size?: number;
}

// Círculo da conta: o ícone que o produtor escolheu ou as iniciais do nome.
export function UserAvatar({ initials, emoji, size = 40 }: UserAvatarProps) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.circle, { width: size, height: size }]}
    >
      <Text style={[styles.text, { fontSize: size * (emoji ? 0.5 : 0.4) }]}>{emoji ?? initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.full,
    backgroundColor: colors.primaryTint,
    borderWidth: 2,
    borderColor: colors.primaryBorder,
  },
  text: { fontWeight: "900", color: colors.primaryText },
});
