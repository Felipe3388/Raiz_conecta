import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { colors, radius, spacing, typography } from "@/theme";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  // "amber" é o tom do catálogo; "green" é o padrão.
  accent?: "green" | "amber";
}

const ACCENTS = {
  green: { focus: colors.primary, rest: colors.borderStrong },
  amber: { focus: colors.warning, rest: colors.warningBorder },
};

export function SearchBar({ value, onChangeText, placeholder = "Buscar...", accent = "green" }: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const tone = ACCENTS[accent];

  return (
    <View style={[styles.box, { borderColor: isFocused ? tone.focus : tone.rest }]}>
      <Ionicons name="search-outline" size={22} color={colors.textSubtle} />
      <TextInput
        accessibilityLabel={placeholder}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSubtle}
        autoCorrect={false}
        returnKeyType="search"
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={styles.input}
      />
      {value !== "" && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Limpar busca"
          hitSlop={12}
          onPress={() => onChangeText("")}
        >
          <Ionicons name="close-circle" size={22} color={colors.textSubtle} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    minHeight: 52,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderRadius: radius.md,
  },
  input: { ...typography.input, flex: 1, color: colors.text, outlineWidth: 0 },
});
