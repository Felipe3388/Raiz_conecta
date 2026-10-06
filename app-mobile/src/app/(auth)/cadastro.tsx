import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { BrandHeader } from "@/components/motion/BrandHeader";
import { Reveal } from "@/components/motion/Reveal";
import { staggerDelay } from "@/components/motion/timing";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { ChoiceGroup, type ChoiceOption } from "@/components/ui/ChoiceGroup";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { FormScreen } from "@/components/ui/FormScreen";
import { Input } from "@/components/ui/Input";
import { LegalModal } from "@/components/ui/LegalModal";
import { PasswordChecklist } from "@/components/ui/PasswordChecklist";
import { PasswordStrengthMeter } from "@/components/ui/PasswordStrengthMeter";
import { StepProgress } from "@/components/ui/StepProgress";
import { PRIVACY_POLICY, TERMS_OF_USE } from "@/content/legalDocuments";
import { NAME_FIELD_COPY } from "@/content/registrationCopy";
import { useAccountStep } from "@/hooks/useAccountStep";
import { backToLogin } from "@/lib/navigation";
import { colors, spacing, typography } from "@/theme";
import type { RegistrationProfile } from "@/types/registration";

const PROFILE_OPTIONS: ChoiceOption<RegistrationProfile>[] = [
  { value: "produtor", label: "Produtor Rural", icon: "🌱", description: "Eu vendo o que planto" },
  {
    value: "mercado",
    label: "Mercado / Supermercado",
    icon: "🏪",
    description: "Eu compro dos produtores",
  },
];

type OpenDocument = "terms" | "privacy" | null;

export default function CadastroScreen() {
  const { account, update, setPhone, error, submit } = useAccountStep();
  const [openDocument, setOpenDocument] = useState<OpenDocument>(null);
  const nameCopy = NAME_FIELD_COPY[account.profile];
  const hasPasswordMismatch =
    account.confirmarSenha !== "" && account.senha !== account.confirmarSenha;
  const hasPasswordMatch = account.confirmarSenha !== "" && !hasPasswordMismatch;

  // Cada bloco entra um pouco depois do anterior.
  let order = 0;
  const next = () => staggerDelay(order++);

  return (
    <FormScreen animated={false}>
      <BrandHeader />
      <Reveal delay={next()}>
        <StepProgress step={1} total={2} />
      </Reveal>
      <Reveal delay={next()} style={styles.intro}>
        <Text style={styles.title}>Junte-se a nós</Text>
        <Text style={styles.subtitle}>Vamos começar! Preencha seus dados abaixo.</Text>
      </Reveal>

      {error && <ErrorBanner key={error} message={error} />}

      <Reveal delay={next()}>
        <ChoiceGroup
          label="Quem é você?"
          layout="cards"
          options={PROFILE_OPTIONS}
          value={account.profile}
          onChange={(profile) => update({ profile })}
        />
      </Reveal>
      <Reveal delay={next()}>
        <Input
          label={nameCopy.label}
          hint={nameCopy.hint}
          icon="person-outline"
          placeholder={nameCopy.placeholder}
          autoCapitalize="words"
          value={account.nome}
          onChangeText={(nome) => update({ nome })}
        />
      </Reveal>
      <Reveal delay={next()}>
        <Input
          label="Seu e-mail"
          hint="Vamos avisar por aqui quando sua conta for aprovada."
          icon="mail-outline"
          placeholder="Ex.: maria@email.com"
          keyboardType="email-address"
          autoComplete="email"
          value={account.email}
          onChangeText={(email) => update({ email })}
        />
      </Reveal>
      <Reveal delay={next()}>
        <Input
          label="Celular com WhatsApp"
          hint="Digite com o DDD. Os parênteses e o traço aparecem sozinhos."
          icon="logo-whatsapp"
          placeholder="Ex.: (12) 91234-5678"
          keyboardType="phone-pad"
          autoComplete="tel"
          value={account.telefone}
          onChangeText={setPhone}
        />
      </Reveal>

      <Reveal delay={next()} style={styles.group}>
        <Input
          label="Crie uma senha"
          hint="Anote a senha em um lugar seguro."
          icon="lock-closed-outline"
          placeholder="Digite sua senha"
          secure
          value={account.senha}
          onChangeText={(senha) => update({ senha })}
        />
        <PasswordChecklist password={account.senha} />
        {account.senha !== "" && <PasswordStrengthMeter password={account.senha} />}
      </Reveal>

      <Reveal delay={next()} style={styles.group}>
        <Input
          label="Repita a senha"
          icon="lock-closed-outline"
          placeholder="Digite a mesma senha de novo"
          secure
          value={account.confirmarSenha}
          onChangeText={(confirmarSenha) => update({ confirmarSenha })}
          error={hasPasswordMismatch ? "As senhas não coincidem." : undefined}
        />
        {hasPasswordMatch && <Text style={styles.match}>Senhas conferem!</Text>}
      </Reveal>

      <Reveal delay={next()} style={styles.group}>
        <Text style={styles.legalTitle}>Antes de continuar, leia com calma:</Text>
        <Button
          label="Ler os Termos de Uso"
          variant="outline"
          onPress={() => setOpenDocument("terms")}
        />
        <Button
          label="Ler a Política de Privacidade"
          variant="outline"
          onPress={() => setOpenDocument("privacy")}
        />
        <Checkbox
          checked={account.acceptedTerms}
          onChange={(acceptedTerms) => update({ acceptedTerms })}
        >
          <Text style={styles.terms}>
            Li e concordo com os <Text style={styles.termsStrong}>Termos de Uso</Text> e com a{" "}
            <Text style={styles.termsStrong}>Política de Privacidade</Text>.
          </Text>
        </Checkbox>
      </Reveal>

      <Reveal delay={next()} style={styles.group}>
        <Button
          label="Avançar para o Passo 2"
          size="lg"
          onPress={() => submit() && router.push("/completar-perfil")}
        />
        <Button label="Já tenho conta" variant="ghost" onPress={backToLogin} />
      </Reveal>

      <LegalModal
        document={TERMS_OF_USE}
        icon="document-text-outline"
        visible={openDocument === "terms"}
        onClose={() => setOpenDocument(null)}
      />
      <LegalModal
        document={PRIVACY_POLICY}
        icon="shield-checkmark-outline"
        visible={openDocument === "privacy"}
        onClose={() => setOpenDocument(null)}
      />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  intro: { alignItems: "center", gap: spacing.xs },
  title: { ...typography.title, color: colors.text, textAlign: "center" },
  subtitle: { ...typography.body, color: colors.textMuted, textAlign: "center" },
  group: { gap: spacing.sm },
  match: { ...typography.hint, color: colors.primary, fontWeight: "700" },
  legalTitle: { ...typography.label, color: colors.text },
  terms: { ...typography.body, color: colors.textMuted, lineHeight: 22 },
  termsStrong: { color: colors.primaryText, fontWeight: "700" },
});
