import { StyleSheet, Text } from "react-native";
import { colors, typography } from "@/theme";

interface ScreenHeadingProps {
  title: string;
  // Quantidade mostrada entre parênteses, como nas abas do site: "Mural de Oportunidades (5)".
  count?: number;
}

export function ScreenHeading({ title, count }: ScreenHeadingProps) {
  return (
    <Text accessibilityRole="header" style={styles.title}>
      {title}
      {count !== undefined && <Text style={styles.count}> ({count})</Text>}
    </Text>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.title, fontSize: 24, color: colors.text },
  count: { color: colors.primary },
});
