import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { DeliveryCardView } from "@/components/entregas/DeliveryCardView";
import { PickListCard } from "@/components/entregas/PickListCard";
import { WeighSheet } from "@/components/entregas/WeighSheet";
import { ScreenHeading } from "@/components/produtor/ScreenHeading";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterChips } from "@/components/ui/FilterChips";
import { ListScreen } from "@/components/ui/ListScreen";
import { LoadError } from "@/components/ui/LoadError";
import { PageLoader } from "@/components/ui/PageLoader";
import { handOverText, pickListTitle } from "@/content/deliveryTexts";
import { useEntregasScreen } from "@/hooks/useEntregasScreen";
import { DONE_FILTER } from "@/lib/delivery/plan";
import { colors, spacing, typography } from "@/theme";

// Entregas: o que separar em cada dia, pedido por pedido, e a pesagem que confere o peso antes de a logística levar.
export default function EntregasScreen() {
  const screen = useEntregasScreen();

  if (screen.status === "loading") return <PageLoader />;
  if (screen.status === "error") return <LoadError onRetry={screen.reload} />;

  const chip = screen.chips.find((item) => item.id === screen.filter);
  const confirm = screen.handOver.card ? handOverText(screen.handOver.card) : null;

  const header = (
    <View style={styles.header}>
      <View style={styles.top}>
        <ScreenHeading title="Entregas" count={screen.cards.length} />
        <Text style={styles.subtitle}>Separe e pese o que você prometeu. O mercado confere o peso ao receber.</Text>
      </View>

      <FilterChips
        value={screen.filter}
        onChange={screen.chooseDay}
        options={screen.chips.map((item) => ({ value: item.id, label: item.label, count: item.count }))}
      />

      {screen.pickList.length > 0 && <PickListCard title={pickListTitle(chip?.label ?? "")} items={screen.pickList} />}

      {screen.cards.length > 0 && (
        <Text accessibilityRole="header" style={styles.section}>
          {screen.filter === DONE_FILTER ? "Pedidos concluídos" : "Por pedido"}
        </Text>
      )}
    </View>
  );

  return (
    <>
      <ListScreen
        data={screen.cards}
        keyExtractor={(card) => card.delivery.id}
        header={header}
        empty={
          screen.total === 0 ? (
            <EmptyState
              icon={<Ionicons name="cube-outline" size={40} color={colors.primary} />}
              title="Nenhuma entrega ainda."
              description="Quando você ofertar no Mural, o que precisa entregar aparece aqui."
            />
          ) : (
            <EmptyState
              icon={<Ionicons name="calendar-outline" size={40} color={colors.primary} />}
              title="Nada para entregar neste dia."
              description="Escolha outro dia acima para ver o que separar."
            />
          )
        }
        renderItem={(card) => (
          <DeliveryCardView
            card={card}
            onWeigh={() => screen.weigh.open(card.delivery.id)}
            onHandOver={() => screen.handOver.ask(card.delivery.id)}
            onSimulateReceipt={
              screen.canSimulateReceipt ? () => screen.weigh.open(card.delivery.id, "MERCADO") : undefined
            }
          />
        )}
      />

      <WeighSheet
        visible={screen.weigh.card !== null}
        card={screen.weigh.card}
        role={screen.weigh.role}
        onRegister={screen.weigh.register}
        onRemove={screen.weigh.remove}
        onClose={screen.weigh.close}
      />

      <ConfirmModal
        visible={confirm !== null}
        title={confirm?.title ?? ""}
        description={confirm?.description ?? ""}
        confirmLabel={confirm?.warning ? "Entregar mesmo assim" : "Entregar"}
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
  subtitle: { ...typography.body, color: colors.textMuted },
  section: { ...typography.heading, fontSize: 18, color: colors.text, marginTop: spacing.xs },
});
