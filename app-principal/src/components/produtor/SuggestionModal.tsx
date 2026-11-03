"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";

interface SuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// "Sugerir novo produto": o produtor manda o nome, um preço de referência e uma foto; a administração avalia.
export function SuggestionModal({ isOpen, onClose }: SuggestionModalProps) {
  const [form, setForm] = useState({ nome: "", descricao: "", precoSugerido: "" });
  const [photo, setPhoto] = useState<File | null>(null);
  const [sending, setSending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.nome.trim()) return toast.warning("Dê um nome ao produto.");

    setSending(true);
    const data = new FormData();
    data.append("nomeProduto", form.nome.trim());
    data.append("descricao", form.descricao.trim());
    if (form.precoSugerido) data.append("precoSugerido", form.precoSugerido);
    if (photo) data.append("file", photo);

    try {
      const res = await fetch("/api/produtor/sugestao", { method: "POST", body: data });
      if (!res.ok) throw new Error(String(res.status));
      toast.success("Sugestão enviada!", { description: "Nossa equipe vai avaliar e adicionar ao catálogo." });
      setForm({ nome: "", descricao: "", precoSugerido: "" });
      setPhoto(null);
      onClose();
    } catch {
      toast.error("Não foi possível enviar a sugestão.");
    } finally {
      setSending(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Sugerir Novo Produto">
      <p className="text-sm text-gray-500 mb-5">Não achou o que planta? Envie os detalhes e nossa equipe avalia.</p>
      <form onSubmit={submit} className="space-y-4">
        <Input
          label="Nome do Produto *"
          name="nome"
          value={form.nome}
          onChange={(e) => setForm({ ...form, nome: e.target.value })}
          placeholder="Ex: Pitaya Vermelha"
          required
        />
        <Input
          label="Preço Sugerido por Kg (R$)"
          name="precoSugerido"
          type="number"
          step="0.01"
          value={form.precoSugerido}
          onChange={(e) => setForm({ ...form, precoSugerido: e.target.value })}
          placeholder="Ex: 8.50"
        />
        <div>
          <label htmlFor="sug-desc" className="text-sm font-semibold text-gray-700 block mb-1.5">Descrição Breve</label>
          <textarea
            id="sug-desc"
            rows={3}
            value={form.descricao}
            onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            placeholder="Ex: Cultivamos pitaya orgânica livre de agrotóxicos..."
            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 outline-none resize-none text-sm"
          />
        </div>
        <div>
          <label htmlFor="sug-foto" className="text-sm font-semibold text-gray-700 block mb-1.5">Foto de Referência (opcional)</label>
          <input
            id="sug-foto"
            type="file"
            accept="image/*"
            onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
            className="w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm outline-none file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-amber-50 file:text-amber-700 cursor-pointer"
          />
        </div>
        <Button type="submit" isLoading={sending} className="w-full bg-amber-600 hover:bg-amber-700 h-12 mt-1">
          Enviar Sugestão
        </Button>
      </form>
    </Modal>
  );
}
