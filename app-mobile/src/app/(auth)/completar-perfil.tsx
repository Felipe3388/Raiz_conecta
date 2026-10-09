import { Redirect, router } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Reveal } from "@/components/motion/Reveal";
import { staggerDelay } from "@/components/motion/timing";
import { AttachmentField } from "@/components/ui/AttachmentField";
import { Button } from "@/components/ui/Button";
import { ChoiceList, type ChoiceOption } from "@/components/ui/ChoiceList";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { FormScreen } from "@/components/ui/FormScreen";
import { Input } from "@/components/ui/Input";
import { SectionCard } from "@/components/ui/SectionCard";
import { StepProgress } from "@/components/ui/StepProgress";
import { DOCUMENT_EXAMPLES, DOCUMENT_LABELS, PROOF_LABELS, PROOF_PHOTO_TITLES } from "@/content/registrationLabels";
import { useProfileStep } from "@/hooks/useProfileStep";
import { validateAccount } from "@/lib/validation/registration";
import { colors, spacing, typography } from "@/theme";

function toOptions<T extends string>(values: T[], labels: Record<T, string>): ChoiceOption<T>[] {
  return values.map((value) => ({ value, label: labels[value] }));
}

export default function CompletarPerfilScreen() {
  const step = useProfileStep();
  const { account, profile } = step;

  // Entrou direto, sem passar pelo passo 1: volta para o início do cadastro.
  if (validateAccount(account) !== null) return <Redirect href="/cadastro" />;

  const firstName = account.nome.trim().split(" ")[0];
  const documentName = profile.documentType;

  async function finish() {
    if (await step.submit()) router.replace("/em-analise");
  }

  let order = 0;
  const next = () => staggerDelay(order++);

  return (
    <FormScreen animated={false}>
      <Reveal delay={next()}>
        <StepProgress step={2} total={2} />
      </Reveal>
      <Reveal delay={next()} style={styles.header}>
        <Text style={styles.title}>Quase lá, {firstName}!</Text>
        <Text style={styles.subtitle}>Agora precisamos do seu documento e do endereço para confirmar que é você.</Text>
      </Reveal>

      {step.error && <ErrorBanner key={step.error} message={step.error} />}

      <Reveal delay={next()}>
        <SectionCard title="Seu documento" icon="document-text-outline">
          <ChoiceList
            label="Qual documento você vai usar?"
            options={toOptions(step.documentTypes, DOCUMENT_LABELS)}
            value={profile.documentType}
            onChange={step.setDocumentType}
          />
          <Input
            label={`Número do ${documentName}`}
            placeholder={DOCUMENT_EXAMPLES[profile.documentType]}
            keyboardType="number-pad"
            value={profile.documento}
            onChangeText={step.setDocument}
          />
        </SectionCard>
      </Reveal>

      <Reveal delay={next()}>
        <SectionCard title="Onde você fica" icon="location-outline" iconColor={colors.info}>
          <View>
            <Input
              label="CEP"
              placeholder="Ex.: 18110-000"
              keyboardType="number-pad"
              autoComplete="postal-code"
              value={profile.cep}
              onChangeText={step.setCep}
            />
            {step.isLookingUpCep && <ActivityIndicator style={styles.cepLoader} color={colors.primary} size="small" />}
          </View>
          <Input
            label="Rua ou estrada"
            placeholder="Ex.: Estrada Rural, Km 12"
            autoCapitalize="words"
            value={profile.rua}
            onChangeText={(rua) => step.update({ rua })}
          />
          <Input
            label="Número"
            placeholder="Ex.: 120 ou S/N"
            autoCapitalize="characters"
            value={profile.numero}
            onChangeText={(numero) => step.update({ numero })}
          />
          <Input
            label="Bairro"
            placeholder="Ex.: Centro"
            autoCapitalize="words"
            value={profile.bairro}
            onChangeText={(bairro) => step.update({ bairro })}
          />
          <View style={styles.row}>
            <View style={styles.grow}>
              <Input
                label="Cidade"
                placeholder="Ex.: Votorantim"
                autoCapitalize="words"
                value={profile.cidade}
                onChangeText={(cidade) => step.update({ cidade })}
              />
            </View>
            <View style={styles.uf}>
              <Input
                label="Estado"
                placeholder="SP"
                autoCapitalize="characters"
                maxLength={2}
                value={profile.estado}
                onChangeText={(estado) => step.update({ estado: estado.toUpperCase() })}
              />
            </View>
          </View>
        </SectionCard>
      </Reveal>

      <Reveal delay={next()}>
        <SectionCard title="Foto do documento" icon="camera-outline" iconColor={colors.warning}>
          <ChoiceList
            label="Qual foto você vai enviar?"
            options={toOptions(step.proofTypes, PROOF_LABELS)}
            value={profile.proofType}
            onChange={(proofType) => step.update({ proofType })}
          />
          <AttachmentField
            attachment={profile.attachment}
            title={PROOF_PHOTO_TITLES[profile.proofType]}
            onPick={step.attach}
          />
        </SectionCard>
      </Reveal>

      <Reveal delay={next()} style={styles.actions}>
        <Button label="Concluir Cadastro" size="lg" isLoading={step.isSubmitting} onPress={finish} />
        <Button label="Voltar para o Passo 1" variant="ghost" onPress={() => router.back()} />
      </Reveal>
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: "center", gap: spacing.sm },
  title: { ...typography.title, color: colors.primaryText, textAlign: "center" },
  subtitle: { ...typography.body, color: colors.textMuted, textAlign: "center" },
  cepLoader: { position: "absolute", right: spacing.md, top: 62 },
  row: { flexDirection: "row", gap: spacing.sm },
  grow: { flex: 1 },
  uf: { width: 96 },
  actions: { gap: spacing.sm },
});
