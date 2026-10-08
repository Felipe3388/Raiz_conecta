import type { CatalogFilter, CatalogSort } from "@/lib/produtor/catalogView";
import type { MuralSort, OfferFilter, OfferSort } from "@/lib/produtor/demandView";

interface Option<T extends string> {
  value: T;
  label: string;
}

// Textos das ordens e filtros de cada lista. Os valores são as chaves das regras em lib/produtor.
export const CATALOG_SORT_OPTIONS: Option<CatalogSort>[] = [
  { value: "default", label: "Ordem do catálogo" },
  { value: "nameAsc", label: "Nome (A a Z)" },
  { value: "nameDesc", label: "Nome (Z a A)" },
];

export const CATALOG_FILTER_LABELS: Record<CatalogFilter, string> = {
  all: "Todos",
  selected: "Selecionados",
  unselected: "Não selecionados",
};

export const MURAL_SORT_OPTIONS: Option<MuralSort>[] = [
  { value: "recent", label: "Mais recentes" },
  { value: "priceDesc", label: "Maior preço" },
  { value: "missingDesc", label: "O que mais falta" },
  { value: "nameAsc", label: "Nome (A a Z)" },
];

export const OFFER_FILTER_LABELS: Record<OfferFilter, string> = {
  all: "Todas",
  open: "Em aberto",
  closed: "Fechadas",
};

export const OFFER_SORT_OPTIONS: Option<OfferSort>[] = [
  { value: "recent", label: "Mais recentes" },
  { value: "offeredDesc", label: "Maior quantidade que ofertei" },
  { value: "nameAsc", label: "Nome (A a Z)" },
];
