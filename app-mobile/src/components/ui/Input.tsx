import { Ionicons } from "@expo/vector-icons";
import { useState, type ComponentProps } from "react";
import { Pressable, StyleSheet, Text, TextInput, View, type KeyboardTypeOptions } from "react-native";
import { colors, radius, spacing, typography } from "@/theme";
import type { IconName } from "@/types/icon";

interface InputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  icon?: IconName;
  placeholder?: string;
  secure?: boolean;
  editable?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoComplete?: ComponentProps<typeof TextInput>["autoComplete"];
  autoCapitalize?: ComponentProps<typeof TextInput>["autoCapitalize"];
  maxLength?: number;
  // Campo de texto maior, para frases (ex.: descrição).
  multiline?: boolean;
  error?: string;
  onSubmitEditing?: () => void;
}

export function Input({
  label,
  value,
  onChangeText,
  icon,
  placeholder,
  secure = false,
  editable = true,
  keyboardType = "default",
  autoComplete,
  autoCapitalize = "none",
  maxLength,
  multiline = false,
  error,
  onSubmitEditing,
}: InputProps) {
  const [isHidden, setIsHidden] = useState(secure);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.box,
          isFocused && styles.boxFocused,
          multiline && styles.boxMultiline,
          !editable && styles.boxDisabled,
          error ? styles.boxError : undefined,
        ]}
      >
        {icon && <Ionicons name={icon} size={22} color={colors.textSubtle} />}
        <TextInput
          accessibilityLabel={label}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textSubtle}
          secureTextEntry={isHidden}
          editable={editable}
          keyboardType={keyboardType}
          autoComplete={autoComplete}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          maxLength={maxLength}
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
          onSubmitEditing={onSubmitEditing}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={[styles.input, multiline && styles.inputMultiline]}
        />
        {secure && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isHidden ? "Mostrar senha" : "Ocultar senha"}
            hitSlop={10}
            onPress={() => setIsHidden((hidden) => !hidden)}
          >
            <Ionicons name={isHidden ? "eye-outline" : "eye-off-outline"} size={24} color={colors.textMuted} />
          </Pressable>
        )}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  label: { ...typography.label, color: colors.text },
  box: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    minHeight: 56,
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderWidth: 1.5,
    borderRadius: radius.md,
  },
  boxFocused: { borderColor: colors.primary },
  boxMultiline: { alignItems: "flex-start", paddingVertical: spacing.sm + 4 },
  boxDisabled: { opacity: 0.6 },
  boxError: { borderColor: colors.danger },
  // outlineWidth remove o contorno padrão do navegador; o foco é indicado pela borda do campo.
  input: { ...typography.input, flex: 1, color: colors.text, outlineWidth: 0 },
  inputMultiline: { minHeight: 88, textAlignVertical: "top" },
  error: { ...typography.hint, color: colors.danger, fontWeight: "600" },
});
