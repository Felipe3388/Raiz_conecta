import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { OrderCardView } from "@/components/entregas/OrderCardView";
import { PickListCard } from "@/components/entregas/PickListCard";
import { WeighRunScreen } from "@/components/entregas/WeighRunScreen";
import { WeighSheet } from "@/components/entregas/WeighSheet";
import { ScreenHeading } from "@/components/produtor/ScreenHeading";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterChips } from "@/components/ui/FilterChips";
import { ListScreen } from "@/components/ui/ListScreen";
import { LoadError } from "@/components/ui/LoadError";
import { PageLoader } from "@/components/ui/PageLoader";
import { orderHandOverText, pickListTitle, RUN_TEXTS } from "@/content/deliveryTexts";
import { useEntregasScreen } from "@/hooks/useEntregasScreen";
import { DONE_FILTER } from "@/lib/delivery/plan";
import { colors, spacing, typography } from "@/theme";

// Entregas: só nos dias de entrega definidos pelos adms (terça e sexta). Em cada dia, o botão Iniciar pesagem (um produto
// por vez, com voz), o total a separar e, abaixo, um cartão por pedido (mercado) com os produtos e os pesos.
export default function EntregasScreen() {
  const screen = useEntregasScreen();

  if (screen.status === "loading") return <PageLoader />;
  if (screen.status === "error") return <LoadError onRetry={screen.reload} />;

  const chip = screen.chips.find((item) => item.id === screen.filter);
  const confirm = screen.handOver.card ? orderHandOverText(screen.handOver.card) : null;

  const header = (
    <View style={styles.header}>
      <View style={styles.top}>
        <ScreenHeading title="Entregas" count={screen.cards.length} />
      </View>

      <FilterChips
        value={screen.filter}
        onChange={screen.chooseDay}
        options={screen.chips.map((item) => ({ value: item.id, label: item.label, count: item.count }))}
      />

      {screen.filter !== DONE_FILTER && screen.dayTotal > 0 && (
        <View style={styles.run}>
          <Button label={RUN_TEXTS.start} disabled={!screen.run.canStart} onPress={screen.run.start} />
          <Text style={styles.runHint}>
            {!screen.run.canStart ? RUN_TEXTS.nothing : screen.run.isAuto ? RUN_TEXTS.startAuto : RUN_TEXTS.startManual}
          </Text>
        </View>
      )}

      {screen.filter !== DONE_FILTER && screen.dayTotal > 0 && (
        <FilterChips
          value={screen.situation}
          onChange={screen.chooseSituation}
          accent="amber"
          options={screen.statuses.map((item) => ({ value: item.value, label: item.label, count: item.count }))}
        />
      )}

      {screen.pickList.length > 0 && <PickListCard title={pickListTitle(chip?.label ?? "")} items={screen.pickList} />}

      {screen.cards.length > 0 && (
        <Text accessibilityRole="header" style={styles.section}>
          {screen.filter === DONE_FILTER ? "Pedidos concluídos" : "Por pedido (mercado)"}
        </Text>
      )}
    </View>
  );

  return (
    <>
      <ListScreen
        data={screen.cards}
        keyExtractor={(card) => card.key}
        header={header}
        empty={
          screen.dayTotal > 0 && screen.situation !== "all" ? (
            <EmptyState
              icon={<Ionicons name="checkmark-done-outline" size={40} color={colors.primary} />}
              title={screen.situation === "toWeigh" ? "Nada falta pesar." : "Nenhum pedido pronto."}
              description={screen.situation === "toWeigh" ? "Tudo pesado neste dia." : "Pedidos pesados aparecem aqui."}
            />
          ) : screen.total === 0 ? (
            <EmptyState
              icon={<Ionicons name="cube-outline" size={40} color={colors.primary} />}
              title="Nenhuma entrega ainda."
              description="Pedidos aceitos aparecem aqui."
            />
          ) : (
            <EmptyState
              icon={<Ionicons name="calendar-outline" size={40} color={colors.primary} />}
              title="Nenhum pedido neste dia."
              description="Escolha outro dia."
            />
          )
        }
        renderItem={(card) => (
          <OrderCardView
            card={card}
            onWeigh={() => screen.weigh.open(card.key)}
            onHandOver={() => screen.handOver.ask(card.key)}
            onSimulateReceipt={screen.canSimulateReceipt ? () => screen.weigh.open(card.key, "MERCADO") : undefined}
          />
        )}
      />

      {screen.run.isOpen && <WeighRunScreen run={screen.run} />}

      <WeighSheet
        visible={screen.weigh.card !== null}
        order={screen.weigh.order}
        card={screen.weigh.card}
        position={screen.weigh.position}
        isLast={screen.weigh.isLast}
        role={screen.weigh.role}
        onRegister={screen.weigh.register}
        onRemove={screen.weigh.remove}
        onSelect={screen.weigh.goTo}
        onPrevious={screen.weigh.previous}
        onNext={screen.weigh.next}
        onClose={screen.weigh.close}
      />

      <ConfirmModal
        visible={confirm !== null}
        title={confirm?.title ?? ""}
        description={confirm?.description ?? ""}
        confirmLabel={confirm?.warning ? "Entregar mesmo assim" : "Entregar pedido"}
        cancelLabel="Voltar"
        variant={confirm?.warning ? "danger" : "success"}
        isLoading={screen.handOver.isLoading}
        onConfirm={screen.handOver.confirm}
        onCancel={screen.handOver.cancel}
      />
    </>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.md },
  top: { gap: spacing.xs },
  run: { gap: spacing.xs },
  runHint: { ...typography.hint, color: colors.textMuted, flexShrink: 1 },
  section: { ...typography.heading, fontSize: 18, color: colors.text, marginTop: spacing.xs },
});
