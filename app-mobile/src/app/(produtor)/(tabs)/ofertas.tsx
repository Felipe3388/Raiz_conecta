import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";
import { DemandCard } from "@/components/produtor/DemandCard";
import { ScreenHeading } from "@/components/produtor/ScreenHeading";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterChips } from "@/components/ui/FilterChips";
import { ListScreen } from "@/components/ui/ListScreen";
import { LoadError } from "@/components/ui/LoadError";
import { PageLoader } from "@/components/ui/PageLoader";
import { SearchBar } from "@/components/ui/SearchBar";
import { SortControl } from "@/components/ui/SortControl";
import { OFFER_FILTER_LABELS, OFFER_SORT_OPTIONS } from "@/content/listOptions";
import { useOffersScreen } from "@/hooks/useOffersScreen";
import type { OfferFilter } from "@/lib/produtor/demandView";
import { colors, spacing } from "@/theme";

const noop = () => {};
const FILTERS: OfferFilter[] = ["all", "open", "closed"];

// Ofertas Fechadas: os pedidos em que o produtor já garantiu uma quantidade.
export default function OfertasScreen() {
  const offers = useOffersScreen();

  if (offers.status === "loading") return <PageLoader />;
  if (offers.status === "error") return <LoadError onRetry={offers.reload} />;

  const header = (
    <View style={styles.header}>
      <ScreenHeading title="Ofertas Fechadas" count={offers.demands.length} />
      {offers.totalCount > 0 && (
        <>
          <SearchBar value={offers.query} onChangeText={offers.setQuery} placeholder="Buscar por produto..." />
          <FilterChips
            value={offers.filter}
            onChange={offers.setFilter}
            options={FILTERS.map((value) => ({
              value,
              label: OFFER_FILTER_LABELS[value],
              count: offers.counts[value],
            }))}
          />
          <View style={styles.toolbar}>
            <SortControl
              options={OFFER_SORT_OPTIONS}
              value={offers.sort}
              defaultValue="recent"
              onChange={offers.setSort}
            />
          </View>
        </>
      )}
    </View>
  );

  return (
    <ListScreen
      data={offers.demands}
      keyExtractor={(demand) => demand.id}
      header={header}
      empty={
        offers.totalCount === 0 ? (
          <EmptyState
            icon={<Ionicons name="checkmark-done-outline" size={40} color={colors.primary} />}
            title="Nenhuma oferta registrada."
            description="Quando você ofertar no Mural, o negócio aparece aqui."
          />
        ) : (
          <EmptyState
            icon={<Ionicons name="search-outline" size={40} color={colors.primary} />}
            title="Nenhuma oferta encontrada"
            description="Tente outro filtro ou outro produto."
          />
        )
      }
      renderItem={(demand) => (
        <DemandCard
          demand={demand}
          producerEmail={offers.email}
          quantity={0}
          onQuantityChange={noop}
          onOffer={noop}
          isSending={false}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.md },
  toolbar: { flexDirection: "row", justifyContent: "flex-start" },
});
