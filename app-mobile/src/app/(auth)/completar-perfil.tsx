import { Ionicons } from "@expo/vector-icons";
import { Redirect, router } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Reveal } from "@/components/motion/Reveal";
import { staggerDelay } from "@/components/motion/timing";
import { AttachmentField } from "@/components/ui/AttachmentField";
import { Button } from "@/components/ui/Button";
import { ChoiceGroup, type ChoiceOption } from "@/components/ui/ChoiceGroup";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { FormScreen } from "@/components/ui/FormScreen";
import { Input } from "@/components/ui/Input";
import { SectionCard } from "@/components/ui/SectionCard";
import { StepProgress } from "@/components/ui/StepProgress";
import { useProfileStep } from "@/hooks/useProfileStep";
import { validateAccount } from "@/lib/validation/registration";
import { colors, spacing, typography } from "@/theme";
import type { DocumentType, ProofType } from "@/types/registration";

const DOCUMENT_LABELS: Record<DocumentType, string> = {
  CPF: "Pessoa Física (CPF)",
  CNPJ: "Empresa (CNPJ)",
};

const DOCUMENT_EXAMPLES: Record<DocumentType, string> = {
  CPF: "Ex.: 123.456.789-01",
  CNPJ: "Ex.: 12.345.678/0001-90",
};

const PROOF_LABELS: Record<ProofType, string> = {
  RG: "RG (Identidade)",
  CNH: "CNH (Carteira de motorista)",
  CONTRATO_SOCIAL: "Contrato Social",
  CARTAO_CNPJ: "Cartão CNPJ",
};

const PROOF_SHORT_LABELS: Record<ProofType, string> = {
  RG: "seu RG",
  CNH: "sua CNH",
  CONTRATO_SOCIAL: "o Contrato Social",
  CARTAO_CNPJ: "o Cartão CNPJ",
};

function toOptions<T extends string>(values: T[], labels: Record<T, string>): ChoiceOption<T>[] {
  return values.map((value) => ({ value, label: labels[value] }));
}

export default function CompletarPerfilScreen() {
  const step = useProfileStep();
  const { account, profile } = step;

  // Entrou direto, sem passar pelo passo 1: volta para o início do cadastro.
  if (validateAccount(account) !== null) return <Redirect href="/cadastro" />;

  const firstName = account.nome.trim().split(" ")[0];
  const isMarket = account.profile === "mercado";
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
        <Text style={styles.subtitle}>
          Agora precisamos do seu documento e do endereço para confirmar que é você.
        </Text>
        <Text style={styles.badge}>
          {isMarket ? "🏪 Cadastrando como Mercado" : "🌱 Cadastrando como Produtor Rural"}
        </Text>
      </Reveal>

      {step.error && <ErrorBanner key={step.error} message={step.error} />}

      <Reveal delay={next()}>
        <SectionCard title="Seu documento" icon="document-text-outline">
          {step.documentTypes.length > 1 ? (
            <ChoiceGroup
              label="Qual documento você vai usar?"
              options={toOptions(step.documentTypes, DOCUMENT_LABELS)}
              value={profile.documentType}
              onChange={step.setDocumentType}
            />
          ) : (
            <View style={styles.notice}>
              <Ionicons name="information-circle-outline" size={24} color={colors.info} />
              <Text style={styles.noticeText}>
                Mercados e supermercados se cadastram somente com CNPJ.
              </Text>
            </View>
          )}
          <Input
            label={`Número do ${documentName}`}
            hint="Digite só os números. Os pontos e traços aparecem sozinhos."
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
              hint="Digite o CEP e o endereço aparece sozinho."
              placeholder="Ex.: 18110-000"
              keyboardType="number-pad"
              autoComplete="postal-code"
              value={profile.cep}
              onChangeText={step.setCep}
            />
            {step.isLookingUpCep && (
              <ActivityIndicator style={styles.cepLoader} color={colors.primary} size="small" />
            )}
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
            hint="Se não tiver número, escreva S/N."
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
        <SectionCard
          title="Foto do documento"
          icon="camera-outline"
          iconColor={colors.warning}
        >
          <ChoiceGroup
            label="Qual foto você vai enviar?"
            options={toOptions(step.proofTypes, PROOF_LABELS)}
            value={profile.proofType}
            onChange={(proofType) => step.update({ proofType })}
          />
          <AttachmentField
            attachment={profile.attachment}
            title={`Foto d${PROOF_SHORT_LABELS[profile.proofType]}`}
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
  badge: {
    ...typography.button,
    color: colors.primaryText,
    backgroundColor: colors.primarySoft,
    borderColor: colors.primaryBorder,
    borderWidth: 2,
    borderRadius: 999,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    overflow: "hidden",
  },
  notice: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.infoSoft,
    borderRadius: 12,
  },
  noticeText: { ...typography.body, flex: 1, color: colors.text },
  cepLoader: { position: "absolute", right: spacing.md, top: 62 },
  row: { flexDirection: "row", gap: spacing.sm },
  grow: { flex: 1 },
  uf: { width: 96 },
  actions: { gap: spacing.sm },
});
