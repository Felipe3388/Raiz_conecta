import { useEffect, useState } from "react";
import { formatPriceInput, parsePrice } from "@/lib/pricing/price";

export const PRICE_ERROR = "Informe um preço válido, por exemplo 3,50.";

// Controller do campo de preço: o texto digitado, a conferência e o salvar. Recomeça a cada vez que abre.
export function usePriceForm(
  visible: boolean,
  currentPrice: number | null,
  onSave: (price: number | null) => Promise<void>,
) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setText(currentPrice === null ? "" : formatPriceInput(currentPrice));
    setError(null);
  }, [visible, currentPrice]);

  function change(value: string) {
    setText(value);
    setError(null);
  }

  async function run(price: number | null) {
    setIsSaving(true);
    try {
      await onSave(price);
    } finally {
      setIsSaving(false);
    }
  }

  async function submit() {
    const price = parsePrice(text);
    if (price === null) {
      setError(PRICE_ERROR);
      return;
    }
    await run(price);
  }

  return {
    text,
    change,
    error,
    isSaving,
    submit,
    remove: () => run(null),
    // Preenche o campo com um valor de referência (ex.: o preço sugerido), sem salvar.
    fill: (price: number) => change(formatPriceInput(price)),
  };
}
