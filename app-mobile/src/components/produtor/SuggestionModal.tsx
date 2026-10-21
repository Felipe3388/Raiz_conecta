import { Ionicons } from "@expo/vector-icons";
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PressableScale } from "@/components/motion/PressableScale";
import { AttachmentField } from "@/components/ui/AttachmentField";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Input } from "@/components/ui/Input";
import { useSuggestionForm } from "@/hooks/useSuggestionForm";
import { colors, radius, spacing, typography } from "@/theme";

interface SuggestionModalProps {
  visible: boolean;
  onClose: () => void;
}

// "Sugerir Novo Produto": para quem não achou o que planta no catálogo.
export function SuggestionModal({ visible, onClose }: SuggestionModalProps) {
  const { form, update, attach, submit, reset, error, isSending } = useSuggestionForm(onClose);

  function close() {
    reset();
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={close}>
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
          <View style={styles.page}>
            <View style={styles.header}>
              <View style={styles.headerIcon}>
                <Ionicons name="chatbubble-ellipses-outline" size={26} color={colors.warningText} />
              </View>
              <Text style={styles.title} accessibilityRole="header">
                Sugerir Novo Produto
              </Text>
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel="Fechar"
                onPress={close}
                style={styles.close}
              >
                <Ionicons name="close" size={22} color={colors.text} />
                <Text style={styles.closeLabel}>Fechar</Text>
              </PressableScale>
            </View>

            <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
              <Text style={styles.intro}>Não achou o que planta? Envie os detalhes e nossa equipe avalia.</Text>
              {error && <ErrorBanner key={error} message={error} />}
              <Input
                label="Nome do Produto *"
                placeholder="Ex: Pitaya Vermelha"
                autoCapitalize="words"
                value={form.nomeProduto}
                onChangeText={(nomeProduto) => update({ nomeProduto })}
              />
              <Input
                label="Preço Sugerido por Kg (R$)"
                placeholder="Ex: 8.50"
                keyboardType="decimal-pad"
                value={form.precoSugerido}
                onChangeText={(precoSugerido) => update({ precoSugerido })}
              />
              <Input
                label="Descrição Breve"
                placeholder="Ex: Cultivamos pitaya orgânica livre de agrotóxicos..."
                multiline
                autoCapitalize="sentences"
                value={form.descricao}
                onChangeText={(descricao) => update({ descricao })}
              />
              <View style={styles.photo}>
                <Text style={styles.photoLabel}>Foto de Referência (Opcional)</Text>
                <AttachmentField
                  attachment={form.attachment}
                  title="Foto do produto"
                  hint="Uma foto ajuda nossa equipe a reconhecer o produto."
                  onPick={attach}
                />
              </View>
            </ScrollView>

            <View style={styles.footer}>
              <Button label="Enviar Sugestão" variant="amber" size="lg" isLoading={isSending} onPress={submit} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: colors.surface },
  page: { flex: 1, width: "100%", maxWidth: 720, alignSelf: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm + 4,
    padding: spacing.md,
    backgroundColor: colors.warningTint,
    borderBottomWidth: 1,
    borderBottomColor: colors.warningBorder,
  },
  headerIcon: { padding: 10, backgroundColor: colors.warningSoft, borderRadius: radius.md },
  title: { ...typography.heading, flex: 1, color: colors.text },
  close: {
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
  form: { padding: spacing.lg, gap: spacing.md },
  intro: { ...typography.body, color: colors.textMuted },
  photo: { gap: spacing.sm },
  photoLabel: { ...typography.label, color: colors.text },
  footer: { padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.background },
});
