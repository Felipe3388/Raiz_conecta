import type { ReactNode } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";
import { colors, spacing } from "@/theme";

interface ScreenProps {
  children: ReactNode;
  // Telas com header/tab bar do Expo Router já respeitam a área segura.
  edges?: Edge[];
}

export function Screen({ children, edges = [] }: ScreenProps) {
  return (
    <SafeAreaView edges={edges} style={styles.container}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.md,
  },
});
