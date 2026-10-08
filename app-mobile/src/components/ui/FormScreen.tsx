import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import type { Edge } from "react-native-safe-area-context";
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
  edges = ["top", "bottom"],
  centered = true,
  bottomSpace = 0,
}: {
  children: ReactNode;
  animated?: boolean;
  // Telas dentro das abas já têm cabeçalho e barra inferior, então não precisam das bordas seguras.
  edges?: Edge[];
  // Centraliza o conteúdo na vertical quando ele é curto (login); telas longas começam no topo.
  centered?: boolean;
  // Folga no fim do conteúdo para o botão flutuante de ajuda não cobrir o último campo.
  bottomSpace?: number;
}) {
  return (
    <Screen edges={edges}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, centered && styles.centered, { paddingBottom: spacing.lg + bottomSpace }]}
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
  scrollContent: { flexGrow: 1, paddingVertical: spacing.lg },
  centered: { justifyContent: "center" },
  column: { width: "100%", maxWidth: MAX_CONTENT_WIDTH, alignSelf: "center", gap: spacing.md },
});
