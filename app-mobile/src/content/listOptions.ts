import type { CatalogFilter, CatalogSort } from "@/lib/produtor/catalogView";
import type { ProposalFilter, ProposalSort } from "@/lib/produtor/proposals";

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

export const PROPOSAL_FILTER_LABELS: Record<ProposalFilter, string> = {
  all: "Todos",
  pending: "Pendentes",
  accepted: "Aceitos",
  closed: "Encerrados",
};

export const PROPOSAL_SORT_OPTIONS: Option<ProposalSort>[] = [
  { value: "priority", label: "Pendentes primeiro" },
  { value: "recent", label: "Mais recentes" },
  { value: "valueDesc", label: "Maior valor" },
  { value: "nameAsc", label: "Mercado (A a Z)" },
];
