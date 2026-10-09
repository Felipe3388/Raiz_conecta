import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "@/theme";
import type { IconName } from "@/types/icon";

type BannerTone = "green" | "amber" | "blue" | "red";

const TONES: Record<BannerTone, { background: string; border: string; text: string }> = {
  green: { background: colors.primarySoft, border: colors.primaryBorder, text: colors.primaryText },
  amber: { background: colors.warningTint, border: colors.warningBorder, text: colors.warningDark },
  blue: { background: colors.infoSoft, border: colors.infoBorder, text: colors.infoDark },
  red: { background: colors.dangerSoft, border: colors.dangerBorder, text: colors.dangerText },
};

interface BannerProps {
  tone: BannerTone;
  icon: IconName;
  title: string;
  children?: ReactNode;
  // Botões ou outros itens abaixo do texto.
  actions?: ReactNode;
}

// Faixa informativa colorida, como o rc-banner do site.
export function Banner({ tone, icon, title, children, actions }: BannerProps) {
  const style = TONES[tone];
  return (
    <View style={[styles.container, { backgroundColor: style.background, borderColor: style.border }]}>
      <View style={styles.header}>
        <Ionicons name={icon} size={24} color={style.text} />
        <Text style={[styles.title, { color: style.text }]}>{title}</Text>
      </View>
      {children && <Text style={[styles.text, { color: style.text }]}>{children}</Text>}
      {actions}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.md, gap: spacing.sm + 4, borderWidth: 1, borderRadius: radius.lg },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  title: { ...typography.heading, flex: 1, fontSize: 18 },
  text: { ...typography.body, lineHeight: 23 },
});
