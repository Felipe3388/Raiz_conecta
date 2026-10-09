import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { StyleSheet, Switch, Text, View } from "react-native";
import { PressableScale } from "@/components/motion/PressableScale";
import { NegotiationPanel } from "@/components/produtor/NegotiationPanel";
import { RoundsTrail } from "@/components/produtor/RoundsTrail";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ChoiceSheet } from "@/components/ui/ChoiceSheet";
import { FormScreen } from "@/components/ui/FormScreen";
import { Input } from "@/components/ui/Input";
import { SectionCard } from "@/components/ui/SectionCard";
import { useSimulatorScreen } from "@/hooks/useSimulatorScreen";
import { formatBRL } from "@/lib/format/currency";
import { START_FACTOR } from "@/lib/pricing/negotiation";
import { colors, radius, spacing, typography } from "@/theme";

// Espaço no fim para o botão de ajuda não cobrir o último bloco.
const BOTTOM_SPACE = 96;

// Simulador de preço: tela de teste do leilão inverso. O pedido é de mentira; só as respostas guardadas
// (se a pessoa ligar a opção) mexem no preço sugerido.
export default function SimuladorPrecoScreen() {
  const simulator = useSimulatorScreen();
  const [isPicking, setIsPicking] = useState(false);
  const { negotiation } = simulator;

  return (
    <FormScreen edges={["bottom"]} centered={false} animated={false} bottomSpace={BOTTOM_SPACE}>
      <View style={styles.intro}>
        <Badge label="Tela de teste" variant="info" />
        <Text style={styles.introText}>
          O sistema parte de um preço baixo e vai subindo conforme você recusa, até chegar ao preço que você pede ou ao
          máximo que o pedido paga.
        </Text>
      </View>

      <SectionCard title="Pedido de teste" icon="flask-outline" iconColor={colors.warning}>
        <View style={styles.field}>
          <Text style={styles.label}>Produto</Text>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={`Produto: ${simulator.produto}. Toque para trocar`}
            onPress={() => setIsPicking(true)}
            style={styles.picker}
          >
            <Text style={styles.pickerText}>{simulator.produto || "Escolher produto"}</Text>
            <Ionicons name="chevron-down" size={20} color={colors.textMuted} />
          </PressableScale>
        </View>
        <Input
          label="Preço que o pedido paga (x)"
          icon="storefront-outline"
          value={simulator.marketText}
          onChangeText={simulator.setMarketText}
          placeholder="Ex.: 45,00"
          keyboardType="decimal-pad"
        />
        <Input
          label="Seu preço, o que você pede (y)"
          icon="pricetag-outline"
          value={simulator.producerText}
          onChangeText={simulator.setProducerText}
          placeholder="Ex.: 46,00"
          keyboardType="decimal-pad"
        />
        <View style={styles.reference}>
          <Text style={styles.referenceLabel}>Média sugerida pela plataforma</Text>
          <Text style={styles.referenceValue}>
            {simulator.suggested ? formatBRL(simulator.suggested.price) : "sem média ainda"}
          </Text>
          {simulator.suggested && (
            <Text style={styles.referenceNote}>Calculada com {simulator.suggested.samples} informações.</Text>
          )}
        </View>
        {simulator.error && <Text style={styles.error}>{simulator.error}</Text>}
      </SectionCard>

      {simulator.preview && !simulator.running && (
        <SectionCard title="Propostas que o mercado fará" icon="stats-chart-outline">
          <RoundsTrail negotiation={simulator.preview} seenCount={simulator.preview.rounds.length} />
          <Text style={styles.referenceNote}>
            Começa em {Math.round(START_FACTOR * 100)}% da média sugerida e sobe em degraus iguais até o teto: o menor
            entre o preço do pedido e o seu.
          </Text>
        </SectionCard>
      )}

      {simulator.running && simulator.marketPrice !== null ? (
        <SectionCard title="Negociação" icon="swap-vertical-outline">
          <NegotiationPanel
            negotiation={negotiation}
            unidade={simulator.unidade}
            producerPrice={simulator.producerPrice}
            marketPrice={simulator.marketPrice}
            finish={<Button label="Recomeçar" variant="amberOutline" onPress={simulator.start} />}
          />
        </SectionCard>
      ) : (
        <Button label="Iniciar negociação" variant="amber" size="lg" onPress={simulator.start} />
      )}

      <SectionCard title="Aprendizado" icon="analytics-outline">
        <View style={styles.switchRow}>
          <View style={styles.switchText}>
            <Text style={styles.label}>Guardar as respostas</Text>
            <Text style={styles.referenceNote}>
              Ligado, cada resposta ajusta o preço sugerido deste produto: recusar acima da média faz ela subir e
              aceitar abaixo dela faz ela descer. Desligado, é só um teste.
            </Text>
          </View>
          <Switch
            accessibilityLabel="Guardar as respostas"
            value={simulator.saveResponses}
            onValueChange={simulator.setSaveResponses}
            trackColor={{ false: colors.borderStrong, true: colors.primary }}
            thumbColor={colors.surface}
          />
        </View>
        <View style={styles.compare}>
          <Text style={styles.referenceLabel}>Preço sugerido</Text>
          <Text style={styles.referenceValue}>
            {simulator.suggestedBefore !== null && simulator.suggested
              ? `${formatBRL(simulator.suggestedBefore)} → ${formatBRL(simulator.suggested.price)}`
              : simulator.suggested
                ? formatBRL(simulator.suggested.price)
                : "—"}
          </Text>
          <Text style={styles.referenceNote}>
            {simulator.suggestedBefore !== null
              ? "Antes de começar → agora."
              : "Inicie uma negociação com as respostas guardadas para ver a média mudar."}
          </Text>
        </View>
      </SectionCard>

      <ChoiceSheet
        visible={isPicking}
        title="Escolher produto"
        options={simulator.names.map((name) => ({ value: name, label: name }))}
        value={simulator.produto}
        onSelect={simulator.chooseProduct}
        onClose={() => setIsPicking(false)}
      />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  intro: { gap: spacing.sm },
  introText: { ...typography.body, color: colors.textMuted },
  field: { gap: spacing.xs },
  label: { ...typography.label, color: colors.text },
  picker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    minHeight: 56,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderWidth: 1.5,
    borderRadius: radius.md,
  },
  pickerText: { ...typography.input, color: colors.text },
  reference: { gap: 2 },
  referenceLabel: { ...typography.hint, fontWeight: "700", color: colors.textMuted },
  referenceValue: { fontSize: 20, fontWeight: "900", color: colors.warningDarkest },
  referenceNote: { ...typography.hint, color: colors.textMuted },
  error: { ...typography.hint, color: colors.danger, fontWeight: "600" },
  switchRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  switchText: { flex: 1, gap: 2 },
  compare: { gap: 2 },
});
