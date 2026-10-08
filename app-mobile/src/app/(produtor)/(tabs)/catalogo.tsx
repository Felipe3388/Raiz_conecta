import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { ProductCard } from "@/components/produtor/ProductCard";
import { ProductRow } from "@/components/produtor/ProductRow";
import { SaveBar } from "@/components/produtor/SaveBar";
import { ScreenHeading } from "@/components/produtor/ScreenHeading";
import { Banner } from "@/components/ui/Banner";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterChips } from "@/components/ui/FilterChips";
import { ListScreen } from "@/components/ui/ListScreen";
import { LoadError } from "@/components/ui/LoadError";
import { PageLoader } from "@/components/ui/PageLoader";
import { SearchBar } from "@/components/ui/SearchBar";
import { SortControl } from "@/components/ui/SortControl";
import { ViewToggle, type ViewOption } from "@/components/ui/ViewToggle";
import { CATALOG_FILTER_LABELS, CATALOG_SORT_OPTIONS } from "@/content/listOptions";
import { useCatalogScreen } from "@/hooks/useCatalogScreen";
import type { CatalogFilter, CatalogLayout } from "@/lib/produtor/catalogView";
import { colors, spacing, typography } from "@/theme";

const FILTERS: CatalogFilter[] = ["all", "selected", "unselected"];

const LAYOUT_OPTIONS: ViewOption<CatalogLayout>[] = [
  { value: "grid", label: "Grade", icon: "grid-outline" },
  { value: "details", label: "Detalhes", icon: "list-outline" },
];

// Espaço no fim da lista: botão de ajuda e, quando aparece, a barra "Salvar Escolhas".
const BOTTOM_SPACE = 110;
const BOTTOM_SPACE_WITH_SAVE_BAR = 200;

function plural(count: number, one: string, many: string) {
  return `${count} ${count === 1 ? one : many}`;
}

// Meu Catálogo: o produtor marca o que planta; o Mural só mostra pedidos desses produtos.
export default function CatalogoScreen() {
  const catalog = useCatalogScreen();

  if (catalog.status === "loading") return <PageLoader />;
  if (catalog.status === "error") return <LoadError onRetry={catalog.reload} />;

  const isDetails = catalog.layout === "details";

  const header = (
    <View style={styles.header}>
      <ScreenHeading title="Meu Catálogo" />
      {!isDetails && (
        <Banner tone="amber" icon="leaf-outline" title="Selecione o que você produz">
          Marque os produtos que você tem capacidade de vender. O Mural só mostrará demandas dos produtos que você marcar aqui.
        </Banner>
      )}
      <SearchBar
        accent="amber"
        value={catalog.query}
        onChangeText={catalog.setQuery}
        placeholder="Buscar produto no catálogo..."
      />
      <FilterChips
        accent="amber"
        value={catalog.filter}
        onChange={catalog.setFilter}
        options={FILTERS.map((value) => ({
          value,
          label: CATALOG_FILTER_LABELS[value],
          count: catalog.counts[value],
        }))}
      />
      <View style={styles.toolbar}>
        <SortControl
          accent="amber"
          options={CATALOG_SORT_OPTIONS}
          value={catalog.sort}
          defaultValue="default"
          onChange={catalog.setSort}
        />
        <ViewToggle accent="amber" options={LAYOUT_OPTIONS} value={catalog.layout} onChange={catalog.setLayout} />
      </View>
      <Text style={styles.counter}>
        {plural(catalog.selectedCount, "selecionado", "selecionados")} ·{" "}
        {plural(catalog.resultCount, "resultado", "resultados")}
      </Text>
    </View>
  );

  return (
    <ListScreen
      data={catalog.products}
      numColumns={isDetails ? 1 : 2}
      gap={isDetails ? spacing.sm : spacing.md}
      bottomSpace={catalog.hasUnsavedSelection ? BOTTOM_SPACE_WITH_SAVE_BAR : BOTTOM_SPACE}
      keyExtractor={(product) => String(product.cdProduto)}
      header={header}
      empty={emptyState(catalog.filter, catalog.query)}
      renderItem={(product) => {
        const selected = catalog.selectedIds.includes(product.cdProduto);
        const toggle = () => catalog.toggleProduct(product.cdProduto);
        return isDetails ? (
          <ProductRow product={product} selected={selected} onToggle={toggle} />
        ) : (
          <ProductCard product={product} selected={selected} onToggle={toggle} />
        );
      }}
      overlay={
        catalog.hasUnsavedSelection ? (
          <SaveBar selectedCount={catalog.selectedCount} isSaving={catalog.isSaving} onSave={catalog.save} />
        ) : undefined
      }
    />
  );
}

function emptyState(filter: CatalogFilter, query: string) {
  const isSearching = query.trim() !== "";
  if (!isSearching && filter === "selected") {
    return (
      <EmptyState
        icon={<Ionicons name="leaf-outline" size={40} color={colors.primary} />}
        title="Você ainda não marcou nenhum produto"
        description="Toque nos produtos que você planta para marcá-los."
      />
    );
  }
  if (!isSearching && filter === "unselected") {
    return (
      <EmptyState
        icon={<Ionicons name="checkmark-done-outline" size={40} color={colors.primary} />}
        title="Você marcou todos os produtos"
        description="Não sobrou nenhum para marcar."
      />
    );
  }
  return (
    <EmptyState
      icon={<Ionicons name="search-outline" size={40} color={colors.primary} />}
      title="Nenhum produto encontrado"
      description="Não achou o que planta? Toque no botão verde de ajuda e escolha Sugerir produto."
    />
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.md },
  toolbar: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  counter: { ...typography.hint, fontWeight: "700", color: colors.warningText },
});
