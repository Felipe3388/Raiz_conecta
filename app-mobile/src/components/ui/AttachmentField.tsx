import { Ionicons } from "@expo/vector-icons";
import { Image, StyleSheet, Text, View } from "react-native";
import type { ImageSource } from "@/lib/media/pickImage";
import { colors, radius, spacing, typography } from "@/theme";
import type { Attachment } from "@/types/registration";
import { Button } from "./Button";

interface AttachmentFieldProps {
  attachment: Attachment | null;
  title: string;
  // Instrução mostrada enquanto não há foto; o padrão é a de foto de documento.
  hint?: string;
  onPick: (source: ImageSource) => void;
}

const DOCUMENT_HINT =
  "Coloque o documento sobre uma mesa, com boa luz, e tire a foto sem cortar as bordas. Tamanho máximo: 5 MB.";

export function AttachmentField({
  attachment,
  title,
  hint = DOCUMENT_HINT,
  onPick,
}: AttachmentFieldProps) {
  return (
    <View style={[styles.box, attachment && styles.boxFilled]}>
      {attachment ? (
        <>
          <Image source={{ uri: attachment.uri }} style={styles.preview} />
          <Text style={styles.filledTitle} numberOfLines={1}>
            {attachment.name}
          </Text>
          <Text style={styles.hint}>Foto anexada! Se não ficou boa, é só trocar abaixo.</Text>
        </>
      ) : (
        <>
          <Ionicons name="camera-outline" size={44} color={colors.textSubtle} />
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.hint}>{hint}</Text>
        </>
      )}
      <View style={styles.actions}>
        <Button label="Tirar foto agora" variant="outline" onPress={() => onPick("camera")} />
        <Button label="Escolher da galeria" variant="outline" onPress={() => onPick("gallery")} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: colors.borderStrong,
  },
  boxFilled: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  preview: { width: 120, height: 120, borderRadius: radius.md },
  title: { ...typography.heading, color: colors.text, textAlign: "center" },
  filledTitle: { ...typography.label, color: colors.primaryText, maxWidth: 260 },
  hint: { ...typography.hint, color: colors.textMuted, textAlign: "center" },
  actions: { alignSelf: "stretch", gap: spacing.sm, marginTop: spacing.sm },
});
