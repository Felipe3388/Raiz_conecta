import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { PressableScale } from "@/components/motion/PressableScale";
import { ScaleCard } from "@/components/produtor/ScaleCard";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { FormScreen } from "@/components/ui/FormScreen";
import { Input } from "@/components/ui/Input";
import { LoadError } from "@/components/ui/LoadError";
import { PageLoader } from "@/components/ui/PageLoader";
import { SCALE_SETUP } from "@/content/scaleTexts";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useScaleSetup } from "@/hooks/useScaleSetup";
import { colors, elevation, radius, spacing, typography } from "@/theme";

// Wi-Fi-inspired connection manager, without pretending that the HTTP API can discover nearby Bluetooth devices.
// Saved scales come from the producer account; label mode requires the device's real pairing code.
export default function BalancaScreen() {
  const screen = useScaleSetup();
  const { refreshing, onRefresh } = usePullToRefresh(screen.refresh);
  if (screen.status === "loading") return <PageLoader />;
  if (screen.status === "error") return <LoadError onRetry={screen.reload} />;

  const { add } = screen;
  const active = screen.scales.find((item) => item.isActive);
  return (
    <FormScreen edges={["bottom"]} centered={false} animated={false} bottomSpace={100} refreshing={refreshing} onRefresh={onRefresh}>
      <View style={styles.hero}>
        <View style={styles.heroIcon}><Ionicons name="wifi-outline" size={27} color={colors.primaryContrast} /></View>
        <View style={styles.heroText}>
          <Text accessibilityRole="header" style={styles.heroTitle}>Conexão com a balança</Text>
          <Text style={styles.heroCaption}>{active ? `Selecionada: ${active.name}` : "Nenhuma balança selecionada"}</Text>
        </View>
        <PressableScale accessibilityRole="button" accessibilityLabel="Atualizar balanças" onPress={() => void onRefresh()} style={styles.refreshIcon}>
          <Ionicons name="refresh" size={23} color={colors.primaryContrast} />
        </PressableScale>
      </View>

      <Text style={styles.sectionTitle}>Balanças salvas</Text>
      <View style={styles.wifiList}>
        {screen.scales.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="radio-outline" size={26} color={colors.textMuted} />
            <Text style={styles.hint}>Nenhuma balança vinculada à sua conta.</Text>
          </View>
        ) : screen.scales
          .slice()
          .sort((a, b) => Number(b.isActive) - Number(a.isActive))
          .map((item) => (
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
      </View>

      <View style={styles.discoveryTitle}>
        <Text style={styles.sectionTitle}>{add.mode === "scan" ? "Balanças disponíveis" : "Adicionar outra balança"}</Text>
        {add.mode === "label" && <Text style={styles.hint}>Vincule uma balança usando a etiqueta ou o QR Code.</Text>}
      </View>

      {add.isOpen ? (
        add.step === 1 ? (
          add.mode === "label" ? (
            <View style={styles.setupCard}>
              <View style={styles.noteRow}>
                <Ionicons name="pricetag-outline" size={21} color={colors.primary} />
                <Text style={[styles.hint, styles.flex]}>{SCALE_SETUP.label.hint}</Text>
              </View>
              <Input label={SCALE_SETUP.label.deviceLabel} value={add.label.device} onChangeText={add.label.changeDevice}
                placeholder={SCALE_SETUP.label.devicePlaceholder} autoCapitalize="characters" />
              <Input label={SCALE_SETUP.label.codeLabel} value={add.label.code} onChangeText={add.label.changeCode}
                placeholder={SCALE_SETUP.label.codePlaceholder} maxLength={9} autoCapitalize="characters"
                error={add.label.error ?? undefined} onSubmitEditing={add.label.submit} />
              <Button label="Conectar balança" isLoading={screen.isWorking} onPress={add.label.submit} />
              {add.canCancel && <Button label="Cancelar" variant="ghost" onPress={add.cancel} />}
            </View>
          ) : (
            <View style={styles.setupCard}>
              {add.isSearching && <Text style={styles.hint}>{SCALE_SETUP.searching}</Text>}
              {!add.isSearching && add.hasSearched && add.devices.length === 0 && <Text style={styles.hint}>{SCALE_SETUP.none}</Text>}
              {add.devices.map((device) => (
                <PressableScale key={device.id} accessibilityRole="button" accessibilityLabel={`Selecionar ${device.name}`}
                  onPress={() => add.select(device)} style={styles.scanRow}>
                  <Ionicons name="wifi-outline" size={23} color={colors.primary} />
                  <Text style={styles.deviceName}>{device.name}</Text>
                  <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                </PressableScale>
              ))}
              <Button label="Procurar novamente" variant="outline" isLoading={add.isSearching} onPress={add.search} />
              {add.canCancel && <Button label="Cancelar" variant="ghost" onPress={add.cancel} />}
            </View>
          )
        ) : (
          <View style={styles.setupCard}>
            <Text style={styles.sectionTitle}>Confirmar conexão</Text>
            <Text style={styles.hint}>Você está vinculando {add.selected?.name} à sua conta.</Text>
            <Button label={SCALE_SETUP.confirm} isLoading={screen.isWorking} onPress={add.confirm} />
            <Button label={SCALE_SETUP.back} variant="ghost" onPress={add.backToChoice} />
          </View>
        )
      ) : (
        <PressableScale accessibilityRole="button" accessibilityLabel="Adicionar balança" onPress={add.open} style={styles.addRow}>
          <Ionicons name="add-circle-outline" size={25} color={colors.primary} />
          <Text style={styles.addLabel}>Adicionar balança</Text>
          <Ionicons name="chevron-forward" size={19} color={colors.textMuted} />
        </PressableScale>
      )}

      <View style={styles.noteRow}>
        <Ionicons name="information-circle-outline" size={18} color={colors.textMuted} />
        <Text style={[styles.hint, styles.flex]}>A lista mostra balanças vinculadas à sua conta. No modo API, não há busca automática de Wi-Fi: use o código da etiqueta para adicionar uma nova.</Text>
      </View>

      <ConfirmModal visible={screen.remove.isConfirming} title={SCALE_SETUP.removeTitle}
        description={`${screen.remove.name}: ${SCALE_SETUP.removeDescription}`} confirmLabel={SCALE_SETUP.remove}
        cancelLabel="Voltar" variant="danger" isLoading={screen.isWorking}
        onConfirm={screen.remove.confirm} onCancel={screen.remove.cancel} />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  hero: { flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: colors.primary,
    borderRadius: radius.lg, padding: spacing.md, boxShadow: elevation.raised },
  heroIcon: { width: 48, height: 48, justifyContent: "center", alignItems: "center",
    borderRadius: radius.md, backgroundColor: "rgba(255,255,255,0.18)" },
  heroText: { flex: 1, gap: 4 },
  heroTitle: { ...typography.heading, fontSize: 20, color: colors.primaryContrast },
  heroCaption: { ...typography.hint, color: colors.primaryContrast },
  refreshIcon: { width: 44, height: 44, justifyContent: "center", alignItems: "center" },
  sectionTitle: { ...typography.heading, fontSize: 17, color: colors.text },
  wifiList: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: "hidden" },
  empty: { padding: spacing.lg, alignItems: "center", gap: spacing.sm },
  hint: { ...typography.hint, color: colors.textMuted },
  discoveryTitle: { gap: 5, marginTop: spacing.sm },
  noteRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, paddingVertical: spacing.xs },
  setupCard: { gap: spacing.md, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  addRow: { minHeight: 62, paddingHorizontal: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface, flexDirection: "row", alignItems: "center", gap: spacing.md },
  addLabel: { flex: 1, ...typography.label, color: colors.text },
  scanRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, minHeight: 55, paddingVertical: spacing.sm },
  deviceName: { flex: 1, ...typography.label, color: colors.text },
});
