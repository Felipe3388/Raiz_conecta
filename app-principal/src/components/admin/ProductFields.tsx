"use client";

import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { CATEGORIAS, UNIDADES } from "@/lib/admin/produtos";

export interface ProductForm {
  nome: string;
  tipo: string;
  preco: string;
  unidadePadrao: string;
  descricao: string;
}

export const EMPTY_PRODUCT: ProductForm = { nome: "", tipo: "Frutas", preco: "", unidadePadrao: "Kg", descricao: "" };

const CATEGORY_OPTIONS = CATEGORIAS.map((value) => ({ value, label: value }));
const UNIT_OPTIONS = UNIDADES.map((value) => ({ value, label: value === "Unidade" ? "Un" : value }));

interface ProductFieldsProps {
  value: ProductForm;
  onChange: (next: ProductForm) => void;
  priceLabel?: string;
  withDescription?: boolean;
  accent?: "green" | "blue";
}

// Os campos do produto do catálogo oficial, iguais no cadastro, na edição e na promoção de uma sugestão.
export function ProductFields({ value, onChange, priceLabel = "Preço (R$)", withDescription = true, accent = "green" }: ProductFieldsProps) {
  const set = (patch: Partial<ProductForm>) => onChange({ ...value, ...patch });
  return (
    <>
      <Input label="Nome do produto" value={value.nome} onChange={(e) => set({ nome: e.target.value })} placeholder="Ex.: Maçã Fuji" maxLength={80} required />
      <div className="flex gap-3">
        <Select label="Categoria" accent={accent} options={CATEGORY_OPTIONS} value={value.tipo} onChange={(e) => set({ tipo: e.target.value })} />
        <Select label="Unidade" accent={accent} options={UNIT_OPTIONS} value={value.unidadePadrao} onChange={(e) => set({ unidadePadrao: e.target.value })} />
      </div>
      <Input label={priceLabel} type="number" inputMode="decimal" step="0.01" min="0.01" value={value.preco} onChange={(e) => set({ preco: e.target.value })} placeholder="Ex.: 5.90" required />
      {withDescription && (
        <div className="space-y-1.5">
          <label htmlFor="produto-descricao" className="text-sm font-semibold text-gray-700 block">Descrição (opcional)</label>
          <textarea
            id="produto-descricao"
            value={value.descricao}
            onChange={(e) => set({ descricao: e.target.value })}
            placeholder="Variedade, características..."
            rows={3}
            maxLength={500}
            className={`w-full p-3 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 resize-none ${accent === "blue" ? "focus:ring-blue-400" : "focus:ring-green-500"}`}
          />
        </div>
      )}
    </>
  );
}

// "5,9" e "5.90" valem o mesmo; o servidor confere de novo.
export function productToFormData(value: ProductForm, file: File | null, id?: number): FormData {
  const data = new FormData();
  if (id !== undefined) data.append("id", String(id));
  data.append("nome", value.nome);
  data.append("tipo", value.tipo);
  data.append("preco", value.preco);
  data.append("unidadePadrao", value.unidadePadrao);
  data.append("descricao", value.descricao);
  if (file) data.append("file", file);
  return data;
}
