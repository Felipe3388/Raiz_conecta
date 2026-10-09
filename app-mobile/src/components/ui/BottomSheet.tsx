import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, type ReactNode } from "react";
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PressableScale } from "@/components/motion/PressableScale";
import { USE_NATIVE_DRIVER } from "@/components/motion/timing";
import { useReducedMotion } from "@/components/motion/useReducedMotion";
import { useKeyboardVisible } from "@/hooks/useKeyboardVisible";
import { colors, radius, spacing, typography } from "@/theme";
import type { IconName } from "@/types/icon";

const MAX_WIDTH = 560;

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: IconName;
  // Botão extra no cabeçalho, ao lado do "Fechar" (ex.: recomeçar a conversa).
  headerAction?: ReactNode;
  children: ReactNode;
  // Faixa fixa no rodapé (ex.: botões ou perguntas).
  footer?: ReactNode;
  // Ocupa quase toda a altura (chat); sem isso, a folha tem a altura do conteúdo.
  tall?: boolean;
}

function SheetBody({
  onClose,
  title,
  subtitle,
  icon,
  headerAction,
  children,
  footer,
  tall,
}: Omit<BottomSheetProps, "visible">) {
  const reduced = useReducedMotion();
  const insets = useSafeAreaInsets();
  const keyboardVisible = useKeyboardVisible();
  const rise = useRef(new Animated.Value(reduced ? 1 : 0)).current;

  useEffect(() => {
    if (reduced) {
      rise.setValue(1);
      return;
    }
    const animation = Animated.timing(rise, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: USE_NATIVE_DRIVER,
    });
    animation.start();
    return () => animation.stop();
  }, [reduced, rise]);

  return (
    // No iPhone o teclado cobre a base da tela: o `padding` sobe a folha junto com ele para o campo ficar à vista.
    // No Android a janela já se ajusta ao teclado (mesmo cuidado dos formulários do app).
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.overlay}>
      <Pressable accessibilityLabel="Fechar" style={StyleSheet.absoluteFill} onPress={onClose} />
      <Animated.View
        accessibilityViewIsModal
        style={[
          styles.sheet,
          tall && styles.tall,
          {
            // Com o teclado aberto ele já cobre a área do gesto de início, então não sobra margem a mais.
            paddingBottom: keyboardVisible ? spacing.md : Math.max(insets.bottom, spacing.md),
            opacity: rise,
            transform: [{ translateY: rise.interpolate({ inputRange: [0, 1], outputRange: [48, 0] }) }],
          },
        ]}
      >
        <View style={styles.header}>
          {icon && (
            <View style={styles.headerIcon}>
              <Ionicons name={icon} size={22} color={colors.primaryText} />
            </View>
          )}
          <View style={styles.headerText}>
            <Text style={styles.title} accessibilityRole="header">
              {title}
            </Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
          {headerAction}
          <PressableScale accessibilityRole="button" accessibilityLabel="Fechar" onPress={onClose} style={styles.close}>
            <Ionicons name="close" size={22} color={colors.text} />
          </PressableScale>
        </View>
        <View style={styles.content}>{children}</View>
        {footer && <View style={styles.footer}>{footer}</View>}
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

// Folha que sobe da base da tela: uma janela leve, sem tirar a pessoa de onde ela estava.
export function BottomSheet({ visible, ...rest }: BottomSheetProps) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={rest.onClose}>
      <SheetBody {...rest} />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(17, 24, 39, 0.5)" },
  sheet: {
    width: "100%",
    maxWidth: MAX_WIDTH,
    maxHeight: "88%",
    alignSelf: "center",
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg + 8,
    borderTopRightRadius: radius.lg + 8,
    overflow: "hidden",
  },
  tall: { height: "88%" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm + 2,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerIcon: { padding: 8, backgroundColor: colors.primaryTint, borderRadius: radius.md },
  headerText: { flex: 1, gap: 2 },
  title: { ...typography.heading, color: colors.text },
  subtitle: { ...typography.hint, color: colors.textMuted },
  close: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.full,
    backgroundColor: colors.surfaceMuted,
  },
  content: { flexShrink: 1, flexGrow: 1 },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.md,
    backgroundColor: colors.surfaceMuted,
  },
});
