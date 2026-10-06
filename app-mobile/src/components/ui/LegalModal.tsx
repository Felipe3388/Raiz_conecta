import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Modal, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PressableScale } from "@/components/motion/PressableScale";
import type { LegalDocument } from "@/content/legalDocuments";
import { colors, radius, spacing, typography } from "@/theme";
import { Button } from "./Button";
import { RichText } from "./RichText";

interface LegalModalProps {
  document: LegalDocument;
  icon: ComponentProps<typeof Ionicons>["name"];
  visible: boolean;
  onClose: () => void;
}

// Documento legal em tela cheia, com letra grande e botão de fechar sempre à vista.
export function LegalModal({ document, icon, visible, onClose }: LegalModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.page}>
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Ionicons name={icon} size={26} color={colors.primaryText} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title} accessibilityRole="header">
                {document.title}
              </Text>
              <Text style={styles.subtitle}>{document.subtitle}</Text>
            </View>
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel="Fechar"
              onPress={onClose}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={22} color={colors.text} />
              <Text style={styles.closeLabel}>Fechar</Text>
            </PressableScale>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.updatedAt}>{document.updatedAt}</Text>
            {document.intro && <RichText text={document.intro} style={styles.paragraph} />}

            {document.sections.map((section) => (
              <View key={section.title} style={styles.section}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                {section.intro && <RichText text={section.intro} style={styles.paragraph} />}
                {section.body && <RichText text={section.body} style={styles.paragraph} />}
                {section.bullets?.map((bullet) => (
                  <View key={bullet} style={styles.bulletRow}>
                    <Text style={styles.bullet}>•</Text>
                    <RichText text={bullet} style={[styles.paragraph, styles.bulletText]} />
                  </View>
                ))}
                {section.outro && <RichText text={section.outro} style={styles.paragraph} />}
              </View>
            ))}
          </ScrollView>

          <View style={styles.footer}>
            <Button label="Entendi, voltar ao cadastro" size="lg" onPress={onClose} />
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  // Em tablets e no navegador a leitura fica em uma coluna centralizada.
  page: { flex: 1, width: "100%", maxWidth: 720, alignSelf: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm + 4,
    padding: spacing.md,
    backgroundColor: colors.primarySoft,
    borderBottomWidth: 1,
    borderBottomColor: colors.primaryBorder,
  },
  headerIcon: { padding: 10, backgroundColor: colors.primaryTint, borderRadius: radius.md },
  headerText: { flex: 1 },
  title: { ...typography.heading, color: colors.text },
  subtitle: { ...typography.hint, color: colors.textMuted },
  closeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: 10,
    paddingHorizontal: spacing.sm + 4,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
  },
  closeLabel: { ...typography.button, color: colors.text },
  content: { padding: spacing.lg, gap: spacing.lg },
  updatedAt: { ...typography.hint, color: colors.textSubtle },
  section: { gap: spacing.sm },
  sectionTitle: { fontSize: 19, fontWeight: "800", color: colors.text },
  paragraph: { fontSize: 17, lineHeight: 27, color: colors.text },
  bulletRow: { flexDirection: "row", gap: spacing.sm },
  bullet: { fontSize: 17, lineHeight: 27, color: colors.primary, fontWeight: "900" },
  bulletText: { flex: 1 },
  footer: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
});
