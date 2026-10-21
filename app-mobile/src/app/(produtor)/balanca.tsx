import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { PressableScale } from "@/components/motion/PressableScale";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { FormScreen } from "@/components/ui/FormScreen";
import { LoadError } from "@/components/ui/LoadError";
import { PageLoader } from "@/components/ui/PageLoader";
import { SectionCard } from "@/components/ui/SectionCard";
import { SCALE_SETUP } from "@/content/scaleTexts";
import { useScaleSetup } from "@/hooks/useScaleSetup";
import { colors, radius, spacing, typography } from "@/theme";

// Espaço no fim para o botão de ajuda não cobrir o último botão.
const BOTTOM_SPACE = 96;

// Balança: conecta a balança ao celular em 2 passos (escolher e confirmar). Ela passa a valer só para esta conta.
export default function BalancaScreen() {
  const screen = useScaleSetup();

  if (screen.status === "loading") return <PageLoader />;
  if (screen.status === "error") return <LoadError onRetry={screen.reload} />;

  const { link } = screen;

  return (
    <FormScreen edges={["bottom"]} centered={false} animated={false} bottomSpace={BOTTOM_SPACE}>
      {link ? (
        <SectionCard title={SCALE_SETUP.linkedTitle} icon="checkmark-circle-outline">
          <View style={styles.device}>
            <Ionicons name="scale-outline" size={28} color={colors.primaryPressed} />
            <View style={styles.deviceText}>
              <Text style={styles.deviceName}>{link.deviceName}</Text>
              <Text style={styles.hint}>{SCALE_SETUP.linkedHint}</Text>
            </View>
          </View>
          <Button label={SCALE_SETUP.unlink} variant="outline" onPress={screen.unlink.ask} />
        </SectionCard>
      ) : (
        <>
          <Text style={styles.intro}>{SCALE_SETUP.intro}</Text>

          {screen.step === 1 ? (
            <SectionCard title={`Passo 1 de 2 · ${SCALE_SETUP.steps.find.title}`} icon="radio-outline">
              <Text style={styles.hint}>{SCALE_SETUP.steps.find.hint}</Text>

              {screen.isSearching && <Text style={styles.hint}>{SCALE_SETUP.searching}</Text>}
              {!screen.isSearching && screen.hasSearched && screen.devices.length === 0 && (
                <Text style={styles.hint}>{SCALE_SETUP.none}</Text>
              )}

              {screen.devices.map((device) => (
                <PressableScale
                  key={device.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Escolher ${device.name}`}
                  onPress={() => screen.select(device)}
                  pressedScale={0.985}
                  style={styles.option}
                >
                  <Ionicons name="scale-outline" size={26} color={colors.primaryPressed} />
                  <View style={styles.deviceText}>
                    <Text style={styles.deviceName}>{device.name}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textSubtle} />
                </PressableScale>
              ))}

              <Button
                label={SCALE_SETUP.search}
                variant="outline"
                isLoading={screen.isSearching}
                onPress={screen.search}
              />
            </SectionCard>
          ) : (
            <SectionCard title={`Passo 2 de 2 · ${SCALE_SETUP.steps.confirm.title}`} icon="shield-checkmark-outline">
              <Text style={styles.hint}>{SCALE_SETUP.steps.confirm.hint}</Text>
              <View style={styles.device}>
                <Ionicons name="scale-outline" size={28} color={colors.primaryPressed} />
                <View style={styles.deviceText}>
                  <Text style={styles.deviceName}>{screen.selected?.name}</Text>
                </View>
              </View>
              <Button label={SCALE_SETUP.confirm} isLoading={screen.isWorking} onPress={screen.confirm} />
              <Button label={SCALE_SETUP.back} variant="ghost" onPress={screen.backToChoice} />
            </SectionCard>
          )}
        </>
      )}

      <ConfirmModal
        visible={screen.unlink.isConfirming}
        title={SCALE_SETUP.unlinkTitle}
        description={SCALE_SETUP.unlinkDescription}
        confirmLabel={SCALE_SETUP.unlink}
        cancelLabel="Voltar"
        variant="danger"
        isLoading={screen.isWorking}
        onConfirm={screen.unlink.confirm}
        onCancel={screen.unlink.cancel}
      />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  intro: { ...typography.body, color: colors.textMuted },
  hint: { ...typography.hint, color: colors.textMuted },
  device: { flexDirection: "row", alignItems: "center", gap: spacing.sm + 4 },
  deviceText: { flex: 1, gap: 2 },
  deviceName: { ...typography.label, color: colors.text },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm + 4,
    minHeight: 60,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
});
