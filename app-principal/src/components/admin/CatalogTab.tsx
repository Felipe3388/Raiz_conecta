"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronDown, ChevronUp, Edit2, Eye, Package, Plus, Tag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { PhotoField } from "@/components/ui/PhotoField";
import { useConfirm } from "@/components/ui/useConfirm";
import type { AdminProduct } from "@/lib/admin/types";
import { formatBRL } from "@/lib/format/currency";
import { api } from "@/lib/http/client";
import { EMPTY_PRODUCT, ProductFields, productToFormData, type ProductForm } from "./ProductFields";

interface CatalogTabProps {
  products: AdminProduct[];
  onChanged: () => void;
}

const isInactive = (product: AdminProduct) => product.status === "INATIVO";

export function CatalogTab({ products, onChanged }: CatalogTabProps) {
  const { confirm, dialog } = useConfirm();
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  function toggleExpanded(id: number) {
    setExpanded((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }

  function remove(product: AdminProduct) {
    confirm({
      title: "Remover produto",
      description: `Tirar "${product.nome}" do catálogo oficial? Se algum produtor ou pedido já usa o produto, ele só fica inativo.`,
      confirmLabel: "Remover",
      variant: "danger",
      run: async () => {
        const result = await api<{ message?: string; desativado?: boolean }>(`/api/produtos?id=${product.cdProduto}`, { method: "DELETE" });
        if (!result.ok) return void toast.error(result.error);
        (result.data?.desativado ? toast.info : toast.success)(result.data?.message ?? "Produto removido.");
        onChanged();
      },
    });
  }

  async function reactivate(product: AdminProduct) {
    const result = await api(`/api/produtos`, {
      method: "PUT",
      json: { id: product.cdProduto, nome: product.nome, tipo: product.tipo, preco: product.preco, unidadePadrao: product.unidadePadrao, descricao: product.descricao, status: "ATIVO" },
    });
    if (!result.ok) return void toast.error(result.error);
    toast.success("Produto de volta à vitrine.");
    onChanged();
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <CreateProduct onCreated={onChanged} />

      <Card flat className="p-6 lg:col-span-2">
        <h2 className="rc-section-title flex items-center gap-2 mb-5 pb-3 border-b border-gray-100">
          <Tag size={18} className="text-green-600" aria-hidden="true" /> Vitrine oficial
          <span className="text-gray-400 font-normal text-sm ml-1">({products.filter((product) => !isInactive(product)).length})</span>
        </h2>

        {products.length === 0 ? (
          <EmptyState icon={<Package size={48} className="text-gray-300" aria-hidden="true" />} title="Nenhum produto ainda" description="Cadastre o primeiro produto ao lado." className="py-12 border-0 shadow-none" />
        ) : (
          <ul className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {products.map((product) => {
              const open = expanded.has(product.cdProduto);
              const name = product.nome ?? "Produto";
              return (
                <li key={product.cdProduto} className={`border rounded-2xl p-4 flex flex-col items-center text-center relative group bg-white transition-all hover:border-green-400 hover:shadow-sm ${isInactive(product) ? "border-dashed border-gray-300 opacity-75" : "border-gray-200"}`}>
                  <div className="absolute top-2 right-2 flex gap-1 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 transition-opacity">
                    <button type="button" onClick={() => setEditing(product)} aria-label={`Editar ${name}`} className="grid h-9 w-9 place-items-center bg-white text-blue-500 hover:text-blue-700 rounded-full shadow-sm border border-blue-100">
                      <Edit2 size={14} aria-hidden="true" />
                    </button>
                    <button type="button" onClick={() => remove(product)} aria-label={`Remover ${name}`} className="grid h-9 w-9 place-items-center bg-white text-gray-400 hover:text-red-500 rounded-full border border-gray-200">
                      <Trash2 size={14} aria-hidden="true" />
                    </button>
                  </div>

                  {product.imagemUrl ? (
                    <Image src={product.imagemUrl} alt={name} width={80} height={80} className="w-20 h-20 object-cover rounded-full mb-3 border-4 border-white shadow-sm" />
                  ) : (
                    <div className="w-20 h-20 bg-gray-100 rounded-full mb-3 grid place-items-center text-gray-400 text-xs font-bold shadow-sm border-4 border-white">Sem foto</div>
                  )}
                  <h3 className="font-bold text-gray-800 text-sm leading-tight">{name}</h3>
                  <div className="mt-1.5 flex flex-wrap justify-center gap-1">
                    <Badge variant="neutral">{product.tipo ?? "Outros"}</Badge>
                    {isInactive(product) && <Badge variant="warning">Inativo</Badge>}
                  </div>
                  <p className="text-green-700 font-black mt-2.5 text-sm bg-green-50 px-3 py-1 rounded-lg w-full">
                    {formatBRL(product.preco ?? 0)} <span className="text-gray-400 font-normal">/ {product.unidadePadrao ?? "Kg"}</span>
                  </p>

                  {isInactive(product) && (
                    <button type="button" onClick={() => reactivate(product)} className="mt-2 flex items-center gap-1 h-9 px-2 text-xs text-green-700 hover:text-green-900 font-bold">
                      <Eye size={12} aria-hidden="true" /> Voltar à vitrine
                    </button>
                  )}
                  {product.descricao && (
                    <button type="button" onClick={() => toggleExpanded(product.cdProduto)} aria-expanded={open} className="mt-1 flex items-center gap-1 h-9 px-2 text-xs text-blue-600 hover:text-blue-800 font-bold">
                      {open ? <><ChevronUp size={12} aria-hidden="true" /> Recolher</> : <><ChevronDown size={12} aria-hidden="true" /> Ver mais</>}
                    </button>
                  )}
                  {open && <p className="mt-2 text-xs text-gray-600 bg-gray-50 rounded-xl p-2.5 w-full text-left leading-relaxed border border-gray-100">{product.descricao}</p>}
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <EditProduct product={editing} onClose={() => setEditing(null)} onSaved={onChanged} />
      {dialog}
    </div>
  );
}

function CreateProduct({ onCreated }: { onCreated: () => void }) {
  const [form, setForm] = useState<ProductForm>(EMPTY_PRODUCT);
  const [photo, setPhoto] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    const result = await api("/api/produtos", { method: "POST", form: productToFormData(form, photo) });
    setBusy(false);
    if (!result.ok) return void toast.error(result.error);
    toast.success("Produto adicionado!");
    setForm(EMPTY_PRODUCT);
    setPhoto(null);
    onCreated();
  }

  return (
    <Card flat className="p-6 h-fit">
      <h2 className="rc-section-title flex items-center gap-2 mb-5 pb-3 border-b border-gray-100">
        <Plus size={18} className="text-green-600" aria-hidden="true" /> Cadastrar produto
      </h2>
      <form onSubmit={submit} className="space-y-4">
        <PhotoField label="Foto (opcional)" file={photo} onChange={setPhoto} />
        <ProductFields value={form} onChange={setForm} priceLabel="Preço de referência (R$)" />
        <Button isLoading={busy} type="submit" className="w-full h-11">Adicionar ao catálogo</Button>
      </form>
    </Card>
  );
}

function EditProduct({ product, onClose, onSaved }: { product: AdminProduct | null; onClose: () => void; onSaved: () => void }) {
  return (
    <Modal isOpen={product !== null} onClose={onClose} title="Editar produto">
      {product && <EditProductForm key={product.cdProduto} product={product} onClose={onClose} onSaved={onSaved} />}
    </Modal>
  );
}

function EditProductForm({ product, onClose, onSaved }: { product: AdminProduct; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<ProductForm>({
    nome: product.nome ?? "",
    tipo: product.tipo ?? "Outros",
    preco: String(product.preco ?? ""),
    unidadePadrao: product.unidadePadrao ?? "Kg",
    descricao: product.descricao ?? "",
  });
  const [photo, setPhoto] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    const result = await api("/api/produtos", { method: "PUT", form: productToFormData(form, photo, product.cdProduto) });
    setBusy(false);
    if (!result.ok) return void toast.error(result.error);
    toast.success("Produto atualizado!");
    onSaved();
    onClose();
  }

  return (
    <form onSubmit={submit} className="space-y-4 mt-2">
      <PhotoField label="Foto do produto" file={photo} onChange={setPhoto} currentUrl={product.imagemUrl} hint="Deixe vazio para manter a foto atual." />
      <ProductFields value={form} onChange={setForm} accent="blue" />
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={busy} className="flex-1 border-gray-200 text-gray-600">Cancelar</Button>
        <Button type="submit" isLoading={busy} className="flex-1 bg-blue-600 hover:bg-blue-700">Salvar alterações</Button>
      </div>
    </form>
  );
}
