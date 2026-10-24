import { useState } from "react";
import { pickImage, type ImageSource } from "@/lib/media/pickImage";
import { normalizePrice, validateSuggestion } from "@/lib/produtor/suggestion";
import type { ProductSuggestion } from "@/types/produtor";
import { useProdutorData } from "./useProdutorData";
import { useUndo } from "./useUndo";

const EMPTY: ProductSuggestion = { nomeProduto: "", descricao: "", precoSugerido: "", attachment: null };

// Controller do formulário "Sugerir Novo Produto".
export function useSuggestionForm(onSent: () => void) {
  const { suggestProduct, withdrawSuggestion } = useProdutorData();
  const undo = useUndo();
  const [form, setForm] = useState<ProductSuggestion>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  function update(patch: Partial<ProductSuggestion>) {
    setError(null);
    setForm((current) => ({ ...current, ...patch }));
  }

  async function attach(source: ImageSource) {
    try {
      const attachment = await pickImage(source);
      if (attachment) update({ attachment });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível anexar a foto.");
    }
  }

  async function submit() {
    const message = validateSuggestion(form);
    setError(message);
    if (message) return;

    setIsSending(true);
    try {
      const id = await suggestProduct({ ...form, precoSugerido: normalizePrice(form.precoSugerido) });
      undo.announce({
        title: "Sugestão enviada!",
        description: "Acompanhe em Minhas sugestões.",
        label: `Sugestão de ${form.nomeProduto.trim()}`,
        revert: () => withdrawSuggestion(id),
      });
      setForm(EMPTY);
      onSent();
    } catch {
      // O formulário ocupa a tela toda, então o erro aparece nele e não num aviso escondido atrás.
      setError("Erro ao enviar sugestão. Tente de novo.");
    } finally {
      setIsSending(false);
    }
  }

  function reset() {
    setForm(EMPTY);
    setError(null);
  }

  return { form, update, attach, submit, reset, error, isSending };
}
