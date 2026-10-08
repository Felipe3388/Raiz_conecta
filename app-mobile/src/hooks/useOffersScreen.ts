import { useMemo, useState } from "react";
import { filterByProduct } from "@/lib/produtor/demands";
import {
  filterOffers,
  offerCounts,
  sortOffers,
  type OfferFilter,
  type OfferSort,
} from "@/lib/produtor/demandView";
import { useProdutorData } from "./useProdutorData";

// Controller das Ofertas Fechadas: lista as ofertas do produtor, com busca, filtro e ordem.
export function useOffersScreen() {
  const data = useProdutorData();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<OfferFilter>("all");
  const [sort, setSort] = useState<OfferSort>("recent");

  const searched = useMemo(() => filterByProduct(data.offers, query), [data.offers, query]);
  const demands = useMemo(
    () => sortOffers(filterOffers(searched, filter), sort, data.email),
    [searched, filter, sort, data.email],
  );

  return {
    status: data.status,
    email: data.email,
    demands,
    // Os números dos filtros acompanham a busca.
    counts: offerCounts(searched),
    totalCount: data.offers.length,
    query,
    setQuery,
    filter,
    setFilter,
    sort,
    setSort,
    reload: data.reload,
  };
}
