import { StyleSheet, Switch, Text } from "react-native";
import { FormScreen } from "@/components/ui/FormScreen";
import { LegalModal } from "@/components/ui/LegalModal";
import { SectionCard } from "@/components/ui/SectionCard";
import { SettingsRow } from "@/components/ui/SettingsRow";
import { SignOutConfirm } from "@/components/ui/SignOutConfirm";
import { PRIVACY_POLICY, TERMS_OF_USE } from "@/content/legalDocuments";
import { useSettingsScreen } from "@/hooks/useSettingsScreen";
import { colors, spacing, typography } from "@/theme";

// Espaço no fim para o botão de ajuda não cobrir a última linha.
const BOTTOM_SPACE = 96;

// Configurações: acessibilidade, privacidade e a conta, cada uma no seu bloco.
export default function ConfiguracoesScreen() {
  const settings = useSettingsScreen();

  return (
    <FormScreen edges={["bottom"]} centered={false} animated={false} bottomSpace={BOTTOM_SPACE}>
      <SectionCard title="Acessibilidade" icon="accessibility-outline">
        <SettingsRow
          icon="film-outline"
          label="Reduzir animações"
          description="As telas aparecem sem deslizes nem movimentos."
          right={
            <Switch
              accessibilityLabel="Reduzir animações"
              value={settings.reduceMotion}
              onValueChange={settings.setReduceMotion}
              trackColor={{ false: colors.borderStrong, true: colors.primary }}
              thumbColor={colors.surface}
            />
          }
        />
        <Text style={styles.hint}>Mais opções de acessibilidade chegam em breve.</Text>
      </SectionCard>

      <SectionCard title="Privacidade" icon="shield-checkmark-outline">
        <SettingsRow icon="document-text-outline" label="Termos de Uso" onPress={settings.openTerms} />
        <SettingsRow icon="lock-closed-outline" label="Política de Privacidade" onPress={settings.openPrivacy} />
      </SectionCard>

      <SectionCard title="Testes" icon="flask-outline" iconColor={colors.warning}>
        <SettingsRow
          icon="swap-vertical-outline"
          label="Simulador de preço"
          description="Teste o leilão inverso: o preço sobe até chegar a um valor bom para você."
          onPress={settings.openPriceSimulator}
        />
      </SectionCard>

      <SectionCard title="Conta" icon="person-circle-outline">
        <SettingsRow
          icon="person-outline"
          label="Meu Perfil"
          description="Dados, endereço, senha e ícone."
          onPress={settings.goToProfile}
        />
        <SettingsRow icon="help-buoy-outline" label="Falar com Suporte" onPress={settings.contactSupport} />
        <SettingsRow icon="log-out-outline" label="Sair da conta" tone="danger" onPress={settings.signOut.request} />
      </SectionCard>

      <Text style={styles.version}>Raiz Conecta · Produtor · versão {settings.version}</Text>

      <LegalModal
        document={TERMS_OF_USE}
        icon="document-text-outline"
        visible={settings.openDocument === "terms"}
        onClose={settings.closeDocument}
      />
      <LegalModal
        document={PRIVACY_POLICY}
        icon="shield-checkmark-outline"
        visible={settings.openDocument === "privacy"}
        onClose={settings.closeDocument}
      />
      <SignOutConfirm
        visible={settings.signOut.isConfirming}
        isLoading={settings.signOut.isSigningOut}
        onConfirm={settings.signOut.confirm}
        onCancel={settings.signOut.cancel}
      />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  hint: { ...typography.hint, color: colors.textSubtle },
  version: { ...typography.caption, color: colors.textSubtle, textAlign: "center", marginTop: spacing.sm },
});
