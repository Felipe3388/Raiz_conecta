import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { MarketCard } from "@/components/produtor/MarketCard";
import { OrderBlock } from "@/components/produtor/OrderBlock";
import { ScreenHeading } from "@/components/produtor/ScreenHeading";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterChips } from "@/components/ui/FilterChips";
import { ListScreen } from "@/components/ui/ListScreen";
import { LoadError } from "@/components/ui/LoadError";
import { PageLoader } from "@/components/ui/PageLoader";
import { SearchBar } from "@/components/ui/SearchBar";
import { SortControl } from "@/components/ui/SortControl";
import { PROPOSAL_FILTER_LABELS, PROPOSAL_SORT_OPTIONS } from "@/content/listOptions";
import { ASK_TEXTS, OFFERS_EMPTY, OFFERS_INTRO } from "@/content/proposalTexts";
import { useOffersScreen } from "@/hooks/useOffersScreen";
import { deliveryDayLabel } from "@/lib/delivery/schedule";
import { formatBRL } from "@/lib/format/currency";
import { canAnswer, secondsLeft, isPartial, selectionTotal, type ProposalFilter } from "@/lib/produtor/proposals";
import { colors, spacing, typography } from "@/theme";
import type { Proposal, ProposalResponse } from "@/types/proposal";

const FILTERS: ProposalFilter[] = ["all", "pending", "accepted", "closed"];

// Ofertas: os pedidos dos mercados para o produtor, agrupados por mercado. Cada pedido tem preço fixo e 30 minutos
// para responder; o produtor escolhe quanto aceita de cada produto e as quantidades aceitas ficam planejadas para a
// entrega de terça ou sexta.
export default function OfertasScreen() {
  const offers = useOffersScreen();

  if (offers.status === "loading") return <PageLoader />;
  if (offers.status === "error") return <LoadError onRetry={offers.reload} />;

  const header = (
    <View style={styles.header}>
      <ScreenHeading title="Ofertas" count={offers.orderCount} />
      {offers.totalCount > 0 && (
        <>
          <Text style={styles.intro}>{OFFERS_INTRO}</Text>
          <SearchBar
            value={offers.query}
            onChangeText={offers.setQuery}
            placeholder="Buscar por produto ou mercado..."
          />
          <FilterChips
            value={offers.filter}
            onChange={offers.setFilter}
            options={FILTERS.map((value) => ({
              value,
              label: PROPOSAL_FILTER_LABELS[value],
              count: offers.counts[value],
            }))}
          />
          <View style={styles.toolbar}>
            <SortControl
              options={PROPOSAL_SORT_OPTIONS}
              value={offers.sort}
              defaultValue="priority"
              onChange={offers.setSort}
            />
          </View>
        </>
      )}
    </View>
  );

  const asking = offers.asking;
  const texts = asking?.response.answer === "ACEITAR" ? ASK_TEXTS.accept : ASK_TEXTS.refuse;
  const description = asking ? describeAsking(asking.proposal, asking.response, offers.now) : "";

  return (
    <>
      <ListScreen
        data={offers.markets}
        keyExtractor={(market) => market.key}
        header={header}
        empty={
          offers.totalCount === 0 ? (
            <EmptyState
              icon={<Ionicons name="mail-open-outline" size={40} color={colors.primary} />}
              title={OFFERS_EMPTY.title}
              description={OFFERS_EMPTY.description}
            />
          ) : (
            <EmptyState
              icon={<Ionicons name="search-outline" size={40} color={colors.primary} />}
              title="Nenhum pedido encontrado"
              description="Tente outro filtro ou outra busca."
            />
          )
        }
        renderItem={(market) => (
          <MarketCard
            mercado={market.mercado}
            orderCount={market.orders.length}
            pendingCount={market.orders.filter((order) => canAnswer(order, offers.now)).length}
            open={offers.isOpen(market.key)}
            onToggle={() => offers.toggleMarket(market.key)}
            secondsLeft={soonest(market.orders, offers.now)}
          >
            {market.orders.map((order) => (
              <OrderBlock
                key={order.id}
                proposal={order}
                now={offers.now}
                quantities={offers.quantitiesOf(order)}
                onChangeQuantity={(itemId, value) => offers.setQuantity(order, itemId, value)}
                onAcceptAll={() => offers.acceptEverything(order)}
                onClear={() => offers.clearChoices(order)}
                onConfirm={() => offers.askToAccept(order)}
                onRefuse={() => offers.askToRefuse(order)}
              />
            ))}
          </MarketCard>
        )}
      />

      <ConfirmModal
        visible={asking !== null}
        title={texts.title}
        description={description}
        confirmLabel={texts.confirm}
        cancelLabel={texts.cancel}
        variant={asking?.response.answer === "RECUSAR" ? "danger" : "success"}
        isLoading={offers.isResponding}
        onConfirm={offers.confirm}
        onCancel={offers.cancelAsking}
      />
    </>
  );
}

// Quanto falta para o pedido pendente com o prazo mais curto do mercado (null se nenhum espera resposta).
function soonest(orders: Proposal[], now: Date): number | null {
  const waiting = orders.filter((order) => canAnswer(order, now)).map((order) => secondsLeft(order, now));
  return waiting.length > 0 ? Math.min(...waiting) : null;
}

// O resumo do que vai ser enviado, para a pessoa conferir antes de confirmar.
function describeAsking(proposal: Proposal, response: ProposalResponse, now: Date): string {
  if (response.answer === "RECUSAR") {
    return `Pedido nº ${proposal.numero} de ${proposal.mercado}. Ele segue para outro produtor e você não poderá voltar atrás.`;
  }

  const lines = proposal.itens
    .filter((item) => (response.quantities[item.id] ?? 0) > 0)
    .map((item) => `• ${response.quantities[item.id]} ${item.unidade.toLowerCase()} de ${item.produto}`);
  const partial = isPartial(proposal, response.quantities) ? "\nO que ficou de fora segue para outros produtores." : "";
  return `Pedido nº ${proposal.numero} de ${proposal.mercado}, entrega ${deliveryDayLabel(proposal.entrega, now).toLowerCase()}:\n${lines.join("\n")}\nVocê recebe ${formatBRL(selectionTotal(proposal, response.quantities))}.${partial}`;
}

const styles = StyleSheet.create({
  header: { gap: spacing.md },
  intro: { ...typography.hint, color: colors.textMuted },
  toolbar: { flexDirection: "row", justifyContent: "flex-start" },
});
