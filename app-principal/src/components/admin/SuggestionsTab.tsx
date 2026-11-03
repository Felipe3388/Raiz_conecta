"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowUpRight, Lightbulb, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { useConfirm } from "@/components/ui/useConfirm";
import type { AdminSuggestion } from "@/lib/admin/types";
import { formatBRL } from "@/lib/format/currency";
import { api } from "@/lib/http/client";
import { ProductFields, type ProductForm } from "./ProductFields";

interface SuggestionsTabProps {
  suggestions: AdminSuggestion[];
  onChanged: () => void;
}

export function SuggestionsTab({ suggestions, onChanged }: SuggestionsTabProps) {
  const { confirm, dialog } = useConfirm();
  const [promoting, setPromoting] = useState<AdminSuggestion | null>(null);

  function discard(suggestion: AdminSuggestion) {
    confirm({
      title: "Descartar sugestão",
      description: `Apagar a sugestão "${suggestion.nomeProduto}"? O produtor não será avisado.`,
      confirmLabel: "Descartar",
      variant: "danger",
      run: async () => {
        const result = await api(`/api/produtor/sugestao?id=${suggestion.id}`, { method: "DELETE" });
        if (!result.ok) return void toast.error(result.error);
        toast.info("Sugestão removida.");
        onChanged();
      },
    });
  }

  if (suggestions.length === 0) {
    return <EmptyState icon={<Lightbulb size={56} className="text-amber-300" aria-hidden="true" />} title="Tudo lido!" description="Nenhuma sugestão nova dos produtores no momento." />;
  }

  return (
    <>
      <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {suggestions.map((suggestion) => (
          <li key={suggestion.id}>
            <Card flat className="p-6 flex flex-col justify-between h-full">
              <div>
                <div className="mb-4 pb-4 border-b border-gray-100">
                  <Badge variant="warning" className="mb-2">Nova ideia</Badge>
                  <h3 className="text-xl font-bold text-gray-900 mt-1 break-words">{suggestion.nomeProduto}</h3>
                  <p className="text-xs text-gray-400 mt-0.5 break-all">Por: {suggestion.emailProdutor}</p>
                </div>
                {suggestion.imagemUrl && (
                  <div className="w-full aspect-square relative mb-4 rounded-2xl overflow-hidden border border-gray-100 bg-gray-50">
                    <Image src={suggestion.imagemUrl} alt={`Foto sugerida para ${suggestion.nomeProduto}`} fill className="object-cover" sizes="(max-width: 768px) 100vw, 384px" />
                  </div>
                )}
                <div className="rc-banner rc-banner-amber rounded-xl p-3.5 text-sm mb-5 flex flex-col gap-1">
                  <span className="italic">“{suggestion.descricao || "Sem descrição."}”</span>
                  {suggestion.precoSugerido ? <span className="font-black text-green-700 not-italic">Preço sugerido: {formatBRL(suggestion.precoSugerido)}</span> : null}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Button onClick={() => setPromoting(suggestion)} className="w-full h-11"><ArrowUpRight size={17} aria-hidden="true" /> Revisar e promover</Button>
                <Button onClick={() => discard(suggestion)} variant="ghost" className="w-full h-10 text-xs text-gray-500 hover:text-red-600 hover:bg-red-50">
                  <Trash2 size={15} aria-hidden="true" /> Descartar
                </Button>
              </div>
            </Card>
          </li>
        ))}
      </ul>

      <Modal isOpen={promoting !== null} onClose={() => setPromoting(null)} title="Promover ao catálogo">
        {promoting && <PromoteForm key={promoting.id} suggestion={promoting} onClose={() => setPromoting(null)} onDone={onChanged} />}
      </Modal>
      {dialog}
    </>
  );
}

function PromoteForm({ suggestion, onClose, onDone }: { suggestion: AdminSuggestion; onClose: () => void; onDone: () => void }) {
  const [form, setForm] = useState<ProductForm>({
    nome: suggestion.nomeProduto,
    tipo: "Frutas",
    preco: suggestion.precoSugerido ? String(suggestion.precoSugerido) : "",
    unidadePadrao: "Kg",
    descricao: "",
  });
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    const result = await api("/api/admin/promover-sugestao", { method: "POST", json: { idSugestao: suggestion.id, ...form } });
    setBusy(false);
    if (!result.ok) return void toast.error(result.error);
    toast.success("Produto adicionado ao catálogo!");
    onDone();
    onClose();
  }

  return (
    <form onSubmit={submit} className="space-y-4 mt-2">
      <p className="text-sm text-gray-500">Revise os dados e defina o preço de referência antes de publicar. A descrição e a foto vêm da sugestão.</p>
      <ProductFields value={form} onChange={setForm} priceLabel="Preço de referência (R$)" withDescription={false} />
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={busy} className="flex-1 border-gray-200 text-gray-600">Cancelar</Button>
        <Button type="submit" isLoading={busy} className="flex-1">Publicar produto</Button>
      </div>
    </form>
  );
}
