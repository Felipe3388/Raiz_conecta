import { useMemo, type ReactElement, type ReactNode } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { Reveal } from "@/components/motion/Reveal";
import { staggerDelay } from "@/components/motion/timing";
import { spacing } from "@/theme";
import { Screen } from "./Screen";

const MAX_CONTENT_WIDTH = 720;
// Espaço no fim da lista para as barras flutuantes (botão de ajuda, "Salvar Escolhas") não cobrirem o último item.
const DEFAULT_BOTTOM_SPACE = 110;

// Célula vazia que completa a última linha, para o último item não esticar até a borda.
const FILLER = Symbol("filler");
type Row<T> = T | typeof FILLER;

function withFillers<T>(data: T[], numColumns: number): Row<T>[] {
  const missing = (numColumns - (data.length % numColumns)) % numColumns;
  return [...data, ...Array<typeof FILLER>(missing).fill(FILLER)];
}

interface ListScreenProps<T> {
  data: T[];
  keyExtractor: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  // Elemento (não função): assim a barra de busca não perde o foco a cada letra digitada.
  header: ReactElement;
  empty: ReactElement;
  numColumns?: number;
  // Distância entre os itens (a lista compacta usa menos).
  gap?: number;
  bottomSpace?: number;
  // Barra fixa sobre a lista (opcional).
  overlay?: ReactNode;
}

// Tela de lista: título e busca no topo, itens que entram em sequência e coluna centralizada em telas largas.
export function ListScreen<T>({
  data,
  keyExtractor,
  renderItem,
  header,
  empty,
  numColumns = 1,
  gap = spacing.md,
  bottomSpace = DEFAULT_BOTTOM_SPACE,
  overlay,
}: ListScreenProps<T>) {
  const rows = useMemo(() => withFillers(data, numColumns), [data, numColumns]);

  return (
    <Screen>
      <FlatList
        key={numColumns}
        data={rows}
        numColumns={numColumns}
        keyExtractor={(row, index) => (row === FILLER ? `filler-${index}` : keyExtractor(row as T))}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={header}
        ListEmptyComponent={<View style={styles.empty}>{empty}</View>}
        columnWrapperStyle={numColumns > 1 ? { gap } : undefined}
        contentContainerStyle={[styles.content, { gap, paddingBottom: bottomSpace }]}
        renderItem={({ item, index }) =>
          item === FILLER ? (
            <View style={styles.cell} />
          ) : (
            <Reveal delay={staggerDelay(index)} offset={16} style={numColumns > 1 ? styles.cell : undefined}>
              {renderItem(item as T)}
            </Reveal>
          )
        }
      />
      {overlay}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    width: "100%",
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: "center",
  },
  cell: { flex: 1 },
  empty: { minHeight: 320 },
});
