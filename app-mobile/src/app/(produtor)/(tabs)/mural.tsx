import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StyleSheet, View } from "react-native";
import { DemandCard } from "@/components/produtor/DemandCard";
import { ScreenHeading } from "@/components/produtor/ScreenHeading";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListScreen } from "@/components/ui/ListScreen";
import { LoadError } from "@/components/ui/LoadError";
import { PageLoader } from "@/components/ui/PageLoader";
import { SearchBar } from "@/components/ui/SearchBar";
import { SortControl } from "@/components/ui/SortControl";
import { MURAL_SORT_OPTIONS } from "@/content/listOptions";
import { useMuralScreen } from "@/hooks/useMuralScreen";
import { colors, spacing } from "@/theme";

// Mural de Oportunidades: pedidos dos mercados para os produtos que o produtor marcou no catálogo.
export default function MuralScreen() {
  const mural = useMuralScreen();

  if (mural.status === "loading") return <PageLoader />;
  if (mural.status === "error") return <LoadError onRetry={mural.reload} />;

  const header = (
    <View style={styles.header}>
      <ScreenHeading title="Mural de Oportunidades" count={mural.hasNoProducts ? undefined : mural.demands.length} />
      {!mural.hasNoProducts && (
        <>
          <SearchBar value={mural.query} onChangeText={mural.setQuery} placeholder="Buscar por produto..." />
          <View style={styles.toolbar}>
            <SortControl
              options={MURAL_SORT_OPTIONS}
              value={mural.sort}
              defaultValue="recent"
              onChange={mural.setSort}
            />
          </View>
        </>
      )}
    </View>
  );

  return (
    <ListScreen
      data={mural.demands}
      keyExtractor={(demand) => demand.id}
      header={header}
      empty={emptyState(mural)}
      renderItem={(demand) => (
        <DemandCard
          demand={demand}
          producerEmail={mural.email}
          quantity={mural.quantityOf(demand.id)}
          onQuantityChange={(quantity) => mural.setQuantity(demand.id, quantity)}
          onOffer={() => mural.offer(demand)}
          isSending={mural.sendingId === demand.id}
        />
      )}
    />
  );
}

function emptyState(mural: ReturnType<typeof useMuralScreen>) {
  if (mural.hasNoProducts) {
    return (
      <EmptyState
        icon={<Ionicons name="eye-off-outline" size={40} color={colors.primary} />}
        title="Seu Mural está escondido!"
        description="Marque no seu catálogo os produtos que você planta para ver os pedidos dos mercados."
        actionLabel="Configurar Meu Catálogo"
        onAction={() => router.push("/catalogo")}
      />
    );
  }
  if (mural.totalCount === 0) {
    return (
      <EmptyState
        icon={<Ionicons name="storefront-outline" size={40} color={colors.primary} />}
        title="Nenhuma demanda no momento."
        description="Volte mais tarde ou diversifique seu catálogo."
      />
    );
  }
  return (
    <EmptyState
      icon={<Ionicons name="search-outline" size={40} color={colors.primary} />}
      title="Nenhum pedido encontrado"
      description="Tente buscar por outro produto."
    />
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.md },
  toolbar: { flexDirection: "row", justifyContent: "flex-start" },
});
