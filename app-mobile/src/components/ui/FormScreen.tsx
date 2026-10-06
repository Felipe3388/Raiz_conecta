import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { Reveal } from "@/components/motion/Reveal";
import { spacing } from "@/theme";
import { Screen } from "./Screen";

const MAX_CONTENT_WIDTH = 520;

// Tela de formulário: respeita a área segura, sobe com o teclado, rola quando o conteúdo é longo
// e mantém uma largura confortável em tablets e no navegador.
// Por padrão o conteúdo entra com um fade suave; telas que animam item a item desligam com animated={false}.
export function FormScreen({
  children,
  animated = true,
}: {
  children: ReactNode;
  animated?: boolean;
}) {
  return (
    <Screen edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {animated ? (
            <Reveal offset={10} style={styles.column}>
              {children}
            </Reveal>
          ) : (
            <View style={styles.column}>{children}</View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: "center", paddingVertical: spacing.lg },
  column: { width: "100%", maxWidth: MAX_CONTENT_WIDTH, alignSelf: "center", gap: spacing.md },
});
