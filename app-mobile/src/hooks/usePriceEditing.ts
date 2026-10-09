import { useState } from "react";
import { formatBRL } from "@/lib/format/currency";
import { usePricing } from "./usePricing";
import { useToast } from "./useToast";
import { useUndo } from "./useUndo";

export interface PriceTarget {
  produto: string;
  unidade?: string;
  // Quanto o pedido paga, quando a edição começa por um pedido do Mural.
  marketPrice?: number | null;
}

// Controller de "definir o meu preço": guarda qual produto está sendo editado, salva e deixa desfazer.
export function usePriceEditing() {
  const pricing = usePricing();
  const toast = useToast();
  const undo = useUndo();
  const [target, setTarget] = useState<PriceTarget | null>(null);

  async function save(price: number | null) {
    if (!target) return;
    const { produto } = target;
    const previous = pricing.priceOf(produto);
    try {
      await pricing.setPrice(produto, price);
    } catch (error) {
      toast.show("error", error instanceof Error ? error.message : "Não foi possível salvar o preço.");
      return;
    }
    setTarget(null);
    undo.announce({
      title: price === null ? "Preço removido." : "Preço salvo!",
      description: price === null ? produto : `${produto}: ${formatBRL(price)}`,
      label: `Preço de ${produto}`,
      revert: () => pricing.setPrice(produto, previous),
    });
  }

  return {
    target,
    edit: setTarget,
    close: () => setTarget(null),
    save,
    currentPrice: target ? pricing.priceOf(target.produto) : null,
    suggested: target ? pricing.suggestedOf(target.produto) : null,
    priceOf: pricing.priceOf,
  };
}
