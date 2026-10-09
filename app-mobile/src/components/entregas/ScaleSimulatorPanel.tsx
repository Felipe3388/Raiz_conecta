import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatKg, formatKgInput } from "@/lib/format/weight";
import { parseKg } from "@/lib/delivery/weight";
import { colors, radius, spacing, typography } from "@/theme";
import type { ScaleSimulator } from "@/services";

interface ScaleSimulatorPanelProps {
  simulator: ScaleSimulator;
  // Sugestão pronta: o que falta para chegar ao peso esperado.
  suggestKg: number;
}

// Só aparece com a balança simulada: o módulo de verdade ainda não foi ligado, então aqui a pessoa faz de conta
// que coloca o produto na balança (e que o tira de lá).
export function ScaleSimulatorPanel({ simulator, suggestKg }: ScaleSimulatorPanelProps) {
  const [text, setText] = useState("");
  const typed = parseKg(text);

  return (
    <View style={styles.box}>
      <Text style={styles.title}>Simulador de balança (modo de teste)</Text>
      <Text style={styles.note}>
        A balança de verdade ainda não está ligada. Aqui você faz de conta que coloca o produto nela.
      </Text>
      <Input
        label="Peso do produto na balança (kg)"
        icon="scale-outline"
        value={text}
        onChangeText={setText}
        placeholder="Ex.: 9,88"
        keyboardType="decimal-pad"
      />
      <View style={styles.row}>
        <View style={styles.cell}>
          <Button
            label="Colocar na balança"
            variant="amberOutline"
            size="sm"
            disabled={typed === null}
            onPress={() => typed !== null && simulator.place(typed)}
          />
        </View>
        <View style={styles.cell}>
          <Button label="Tirar da balança" variant="ghost" size="sm" onPress={() => simulator.clear()} />
        </View>
      </View>
      {suggestKg > 0 && (
        <Button
          label={`Colocar o que falta (${formatKg(suggestKg)})`}
          variant="ghost"
          size="sm"
          onPress={() => {
            setText(formatKgInput(suggestKg));
            simulator.place(suggestKg);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.warningTint,
    borderWidth: 1,
    borderColor: colors.warningBorder,
  },
  title: { ...typography.label, color: colors.warningDark },
  note: { ...typography.hint, color: colors.warningDark },
  row: { flexDirection: "row", gap: spacing.sm },
  cell: { flex: 1 },
});
