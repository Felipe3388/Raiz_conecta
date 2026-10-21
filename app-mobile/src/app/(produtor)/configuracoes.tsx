import { StyleSheet, Switch, Text } from "react-native";
import { FormScreen } from "@/components/ui/FormScreen";
import { SettingsGroup } from "@/components/ui/SettingsGroup";
import { SettingsRow } from "@/components/ui/SettingsRow";
import { WEIGH_MODE_TEXTS } from "@/content/deliveryTexts";
import { useSettingsScreen } from "@/hooks/useSettingsScreen";
import { colors, spacing, typography } from "@/theme";

// Espaço no fim para o botão de ajuda não cobrir a última linha.
const BOTTOM_SPACE = 96;

// Configurações: acessibilidade e o modo de pesagem. Privacidade, termos, conta e ajuda moram na aba Mais.
export default function ConfiguracoesScreen() {
  const settings = useSettingsScreen();

  return (
    <FormScreen edges={["bottom"]} centered={false} animated={false} bottomSpace={BOTTOM_SPACE}>
      <SettingsGroup title="Pesagem" footer={`${WEIGH_MODE_TEXTS.hint}`}>
        <SettingsRow
          icon="flash-outline"
          label={WEIGH_MODE_TEXTS.label}
          description={settings.autoWeigh ? WEIGH_MODE_TEXTS.autoOn : WEIGH_MODE_TEXTS.autoOff}
          right={
            <Switch
              accessibilityLabel={WEIGH_MODE_TEXTS.label}
              value={settings.autoWeigh}
              onValueChange={settings.setAutoWeigh}
              trackColor={{ false: colors.borderStrong, true: colors.primary }}
              thumbColor={colors.surface}
            />
          }
        />
        <SettingsRow
          icon="volume-high-outline"
          label={WEIGH_MODE_TEXTS.voiceLabel}
          description={settings.voice ? WEIGH_MODE_TEXTS.voiceOn : WEIGH_MODE_TEXTS.voiceOff}
          right={
            <Switch
              accessibilityLabel={WEIGH_MODE_TEXTS.voiceLabel}
              value={settings.voice}
              onValueChange={settings.setVoice}
              trackColor={{ false: colors.borderStrong, true: colors.primary }}
              thumbColor={colors.surface}
            />
          }
        />
      </SettingsGroup>

      <SettingsGroup title="Acessibilidade" footer="Mais opções de acessibilidade chegam em breve.">
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
      </SettingsGroup>

      <Text style={styles.version}>Raiz Conecta · Produtor · versão {settings.version}</Text>
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  version: { ...typography.caption, color: colors.textSubtle, textAlign: "center", marginTop: spacing.sm },
});
