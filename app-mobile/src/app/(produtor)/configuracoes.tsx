import { StyleSheet, Switch, Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { FormScreen } from "@/components/ui/FormScreen";
import { Input } from "@/components/ui/Input";
import { SettingsGroup } from "@/components/ui/SettingsGroup";
import { SettingsRow } from "@/components/ui/SettingsRow";
import { WEIGH_MODE_TEXTS } from "@/content/deliveryTexts";
import { MAX_SCALE_NAME_LENGTH } from "@/lib/delivery/scaleLink";
import { SCALE_SETTINGS } from "@/content/scaleTexts";
import { useSettingsScreen } from "@/hooks/useSettingsScreen";
import { colors, spacing, typography } from "@/theme";

// Espaço no fim para o botão de ajuda não cobrir a última linha.
const BOTTOM_SPACE = 96;

// Configurações: acessibilidade e o modo de pesagem. Privacidade, termos, conta e ajuda moram na aba Mais.
export default function ConfiguracoesScreen() {
  const settings = useSettingsScreen();

  return (
    <FormScreen edges={["bottom"]} centered={false} animated={false} bottomSpace={BOTTOM_SPACE}>
      {settings.scale.isReady && (
        <SettingsGroup title={SCALE_SETTINGS.title}>
          {settings.scale.isConnected ? (
            <View style={styles.nameBox}>
              <Input
                label={SCALE_SETTINGS.nameLabel}
                icon="scale-outline"
                value={settings.scale.name}
                onChangeText={settings.scale.setName}
                placeholder={SCALE_SETTINGS.namePlaceholder}
                maxLength={MAX_SCALE_NAME_LENGTH}
                autoCapitalize="sentences"
                onSubmitEditing={settings.scale.save}
              />
              <Button
                label={SCALE_SETTINGS.save}
                variant="outline"
                isLoading={settings.scale.isSaving}
                disabled={!settings.scale.canSave}
                onPress={settings.scale.save}
              />
            </View>
          ) : (
            <SettingsRow
              icon="scale-outline"
              label={SCALE_SETTINGS.connectNow}
              description={SCALE_SETTINGS.noneConnected}
              onPress={settings.scale.manage}
            />
          )}
          <SettingsRow icon="swap-horizontal-outline" label={SCALE_SETTINGS.manage} onPress={settings.scale.manage} />
        </SettingsGroup>
      )}

      <SettingsGroup title="Pesagem">
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

      <SettingsGroup title="Acessibilidade">
        <SettingsRow
          icon="film-outline"
          label="Reduzir animações"
          description="Sem movimentos nas telas."
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
  nameBox: { gap: spacing.sm + 4, paddingVertical: spacing.md },
  version: { ...typography.caption, color: colors.textSubtle, textAlign: "center", marginTop: spacing.sm },
});
