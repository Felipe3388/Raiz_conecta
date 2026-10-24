import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { PressableScale } from "@/components/motion/PressableScale";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { FormScreen } from "@/components/ui/FormScreen";
import { LoadError } from "@/components/ui/LoadError";
import { PageLoader } from "@/components/ui/PageLoader";
import { ScaleCard } from "@/components/produtor/ScaleCard";
import { SectionCard } from "@/components/ui/SectionCard";
import { SCALE_SETUP } from "@/content/scaleTexts";
import { useScaleSetup } from "@/hooks/useScaleSetup";
import { colors, radius, spacing, typography } from "@/theme";

// Espaço no fim para o botão de ajuda não cobrir o último botão.
const BOTTOM_SPACE = 96;

// Balança: as balanças do produtor, com a conectada em destaque. Dá para conectar outra, remover e adicionar uma nova
// em 2 passos (escolher e confirmar). Elas valem só para esta conta.
export default function BalancaScreen() {
  const screen = useScaleSetup();

  if (screen.status === "loading") return <PageLoader />;
  if (screen.status === "error") return <LoadError onRetry={screen.reload} />;

  const { add } = screen;

  return (
    <FormScreen edges={["bottom"]} centered={false} animated={false} bottomSpace={BOTTOM_SPACE}>
      <Text style={styles.intro}>{SCALE_SETUP.intro}</Text>

      {screen.scales.length > 0 && (
        <View style={styles.list}>
          <Text accessibilityRole="header" style={styles.listTitle}>
            {SCALE_SETUP.yourScales}
          </Text>
          {screen.scales.map((item) => (
            <ScaleCard
              key={item.deviceId}
              name={item.name}
              originalName={item.originalName}
              isActive={item.isActive}
              disabled={screen.isWorking}
              onConnect={() => screen.connect(item.deviceId)}
              onRemove={() => screen.remove.ask(item.deviceId)}
            />
          ))}
          <Text style={styles.hint}>{SCALE_SETUP.renameHint}</Text>
        </View>
      )}

      {add.isOpen ? (
        add.step === 1 ? (
          <SectionCard title={`Passo 1 de 2 · ${SCALE_SETUP.steps.find.title}`} icon="radio-outline">
            <Text style={styles.hint}>{SCALE_SETUP.steps.find.hint}</Text>

            {add.isSearching && <Text style={styles.hint}>{SCALE_SETUP.searching}</Text>}
            {!add.isSearching && add.hasSearched && add.devices.length === 0 && (
              <Text style={styles.hint}>{SCALE_SETUP.none}</Text>
            )}

            {add.devices.map((device) => (
              <PressableScale
                key={device.id}
                accessibilityRole="button"
                accessibilityLabel={`Escolher ${device.name}`}
                onPress={() => add.select(device)}
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

            <Button label={SCALE_SETUP.search} variant="outline" isLoading={add.isSearching} onPress={add.search} />
            {add.canCancel && <Button label={SCALE_SETUP.cancelAdd} variant="ghost" onPress={add.cancel} />}
          </SectionCard>
        ) : (
          <SectionCard title={`Passo 2 de 2 · ${SCALE_SETUP.steps.confirm.title}`} icon="shield-checkmark-outline">
            <Text style={styles.hint}>{SCALE_SETUP.steps.confirm.hint}</Text>
            <View style={styles.device}>
              <Ionicons name="scale-outline" size={28} color={colors.primaryPressed} />
              <View style={styles.deviceText}>
                <Text style={styles.deviceName}>{add.selected?.name}</Text>
              </View>
            </View>
            <Button label={SCALE_SETUP.confirm} isLoading={screen.isWorking} onPress={add.confirm} />
            <Button label={SCALE_SETUP.back} variant="ghost" onPress={add.backToChoice} />
          </SectionCard>
        )
      ) : (
        <Button label={SCALE_SETUP.add} variant="outline" onPress={add.open} />
      )}

      <ConfirmModal
        visible={screen.remove.isConfirming}
        title={SCALE_SETUP.removeTitle}
        description={`${screen.remove.name}: ${SCALE_SETUP.removeDescription}`}
        confirmLabel={SCALE_SETUP.remove}
        cancelLabel="Voltar"
        variant="danger"
        isLoading={screen.isWorking}
        onConfirm={screen.remove.confirm}
        onCancel={screen.remove.cancel}
      />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  intro: { ...typography.body, color: colors.textMuted },
  list: { gap: spacing.sm + 4 },
  listTitle: { ...typography.sectionHeader, color: colors.textMuted, paddingHorizontal: spacing.xs },
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
