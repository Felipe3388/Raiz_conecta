import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { BrandHeader } from "@/components/motion/BrandHeader";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Input } from "@/components/ui/Input";
import { FormScreen } from "@/components/ui/FormScreen";
import { useLoginForm } from "@/hooks/useLoginForm";
import { colors, spacing, typography } from "@/theme";

export default function LoginScreen() {
  const { email, setEmail, senha, setSenha, error, isSubmitting, submit } = useLoginForm();

  return (
    <FormScreen>
      <View style={styles.header}>
        <BrandHeader size="lg" />
        <Text style={styles.subtitle}>Acesse sua conta para continuar</Text>
      </View>

      {error && <ErrorBanner message={error} />}

      <Input
        label="E-mail"
        icon="mail-outline"
        value={email}
        onChangeText={setEmail}
        placeholder="seu@email.com"
        keyboardType="email-address"
        autoComplete="email"
        editable={!isSubmitting}
      />
      <Input
        label="Senha"
        icon="lock-closed-outline"
        value={senha}
        onChangeText={setSenha}
        placeholder="Sua senha"
        secure
        autoComplete="password"
        editable={!isSubmitting}
        onSubmitEditing={submit}
      />

      <Button label="Entrar" size="lg" isLoading={isSubmitting} onPress={submit} />
      <Button label="Criar conta" variant="ghost" onPress={() => router.push("/cadastro")} />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: "center", gap: spacing.xs, marginBottom: spacing.md },
  subtitle: { ...typography.body, color: colors.textMuted },
});
