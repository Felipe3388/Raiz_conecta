"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowUpRight, Lightbulb, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import type { AdminSuggestion } from "@/lib/admin/types";
import { formatBRL } from "@/lib/format/currency";
import { api } from "@/lib/http/client";
import { ProductFields, type ProductForm } from "./ProductFields";

interface SuggestionsTabProps {
  suggestions: AdminSuggestion[];
  onChanged: () => void;
}

export function SuggestionsTab({ suggestions, onChanged }: SuggestionsTabProps) {
  const [promoting, setPromoting] = useState<AdminSuggestion | null>(null);
  const [rejecting, setRejecting] = useState<AdminSuggestion | null>(null);

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
                <Button onClick={() => setRejecting(suggestion)} variant="ghost" className="w-full h-10 text-xs text-gray-500 hover:text-red-600 hover:bg-red-50">
                  <XCircle size={15} aria-hidden="true" /> Recusar sugestão
                </Button>
              </div>
            </Card>
          </li>
        ))}
      </ul>

      <Modal isOpen={promoting !== null} onClose={() => setPromoting(null)} title="Promover ao catálogo">
        {promoting && <PromoteForm key={promoting.id} suggestion={promoting} onClose={() => setPromoting(null)} onDone={onChanged} />}
      </Modal>
      <Modal isOpen={rejecting !== null} onClose={() => setRejecting(null)} title="Recusar sugestão">
        {rejecting && <RejectForm key={rejecting.id} suggestion={rejecting} onClose={() => setRejecting(null)} onDone={onChanged} />}
      </Modal>
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

// Recusar não apaga a sugestão: o produtor vê o motivo no histórico do aplicativo.
function RejectForm({ suggestion, onClose, onDone }: { suggestion: AdminSuggestion; onClose: () => void; onDone: () => void }) {
  const [motivo, setMotivo] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    const result = await api("/api/produtor/sugestao", {
      method: "PATCH",
      json: { id: suggestion.id, status: "RECUSADA", motivo: motivo.trim() },
    });
    setBusy(false);
    if (!result.ok) return void toast.error(result.error);
    toast.info("Sugestão recusada. O produtor poderá acompanhar a decisão.");
    onDone();
    onClose();
  }

  return (
    <form onSubmit={submit} className="space-y-4 mt-2">
      <p className="text-sm text-gray-600">A sugestão de <strong>{suggestion.nomeProduto}</strong> será marcada como recusada, mas ficará registrada no histórico do produtor.</p>
      <label className="block text-sm font-medium text-gray-700" htmlFor="motivo-recusa">Motivo da recusa (opcional)</label>
      <textarea
        id="motivo-recusa"
        value={motivo}
        onChange={(event) => setMotivo(event.target.value)}
        maxLength={500}
        rows={3}
        placeholder="Ex.: Este produto já consta no catálogo."
        className="w-full rounded-xl border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
      />
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={busy} className="flex-1">Cancelar</Button>
        <Button type="submit" variant="danger" isLoading={busy} className="flex-1">Confirmar recusa</Button>
      </div>
    </form>
  );
}
