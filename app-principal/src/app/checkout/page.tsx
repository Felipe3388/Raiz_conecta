"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, MapPin, PackageOpen, Send, ShieldCheck, ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useMercadoData, type MercadoPerfil } from "@/components/mercado/useMercadoData";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageLoader } from "@/components/ui/PageLoader";
import { QuantityInput } from "@/components/ui/QuantityInput";
import { useConfirm } from "@/components/ui/useConfirm";
import { useCart } from "@/hooks/useCart";
import { formatBRL } from "@/lib/format/currency";
import { MAX_QTD, toRequest } from "@/lib/mercado/cart";
import { categoryIcon, type CatalogProduct } from "@/lib/mercado/catalog";
import { api } from "@/lib/http/client";

const addressComplete = (p: MercadoPerfil) => Boolean(p.rua && p.numero && p.bairro && p.cidade && p.estado && p.cep);

export default function CheckoutConfirmacao() {
  const router = useRouter();
  const { cart, total, setQty, remove, clear, sync } = useCart();
  const { confirm, dialog } = useConfirm();
  const [sending, setSending] = useState(false);

  const onCatalog = useCallback(
    (list: CatalogProduct[]) => {
      const { removed, repriced } = sync(list);
      if (removed.length > 0) toast.warning(`Saíram do catálogo e foram retirados da cotação: ${removed.join(", ")}.`);
      else if (repriced) toast.info("Os preços de referência foram atualizados.");
    },
    [sync],
  );
  const { perfil, loading, error, reload } = useMercadoData(onCatalog);

  async function send() {
    if (sending || cart.length === 0) return;
    setSending(true);
    const result = await api("/api/mercado/demandas", { method: "POST", json: toRequest(cart) });
    setSending(false);

    if (!result.ok) {
      // Produto tirado do catálogo desde que a cotação foi montada: atualiza o catálogo e a cotação.
      if (result.status === 400) void reload();
      return void toast.error(result.error);
    }
    clear();
    toast.success("Cotação enviada!", { description: "Os produtores da região foram avisados. Acompanhe as ofertas em “Minhas cotações”." });
    router.push("/catalogo?aba=cotacoes");
  }

  if (loading) return <PageLoader message="Preparando a cotação..." />;

  if (!perfil) {
    return (
      <div className="rc-page"><div className="rc-container">
        <EmptyState icon={<PackageOpen size={56} className="text-red-300" aria-hidden="true" />} title="Não foi possível abrir a confirmação" description={error || "Tente de novo em instantes."} actionLabel="Tentar de novo" onAction={() => void reload()} />
      </div></div>
    );
  }

  if (perfil.status !== "APROVADO") {
    return (
      <div className="rc-page"><div className="rc-container">
        <EmptyState icon={<AlertTriangle size={56} className="text-amber-400" aria-hidden="true" />} title="Cadastro ainda não aprovado" description="Você poderá disparar cotações assim que a administração liberar sua conta." actionLabel="Ver meu painel" onAction={() => router.push("/catalogo")} />
      </div></div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="rc-page"><div className="rc-container">
        <EmptyState icon={<ShoppingCart size={56} aria-hidden="true" />} title="Sua cotação está vazia" description="Escolha os produtos no catálogo para montar uma cotação." actionLabel="Ir ao catálogo" onAction={() => router.push("/catalogo")} />
      </div></div>
    );
  }

  const hasAddress = addressComplete(perfil);

  return (
    <div className="rc-page">
      <div className="rc-container !max-w-5xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <Link href="/catalogo" className="inline-flex items-center gap-2 h-11 px-4 rounded-xl border border-gray-200 bg-white text-gray-600 hover:text-green-700 font-bold shadow-sm w-max">
            <ArrowLeft size={18} aria-hidden="true" /> Voltar e adicionar mais
          </Link>
          <button
            type="button"
            onClick={() => confirm({ title: "Cancelar esta cotação?", description: "Todos os produtos escolhidos saem da lista.", confirmLabel: "Cancelar cotação", variant: "danger", run: () => { clear(); toast.info("Cotação cancelada."); router.push("/catalogo"); } })}
            className="inline-flex items-center gap-2 h-11 px-4 rounded-xl text-red-600 hover:bg-red-50 font-bold w-max"
          >
            <Trash2 size={18} aria-hidden="true" /> Cancelar cotação
          </button>
        </div>

        <h1 className="!text-3xl flex items-center gap-3"><Send className="text-green-600" size={30} aria-hidden="true" /> Confirmar disparo de cotação</h1>

        <div className="grid md:grid-cols-3 gap-8 items-start">
          <div className="md:col-span-2 space-y-6">
            <Card flat className="p-6">
              <h2 className="mb-6 border-b border-gray-100 pb-4">Revise o volume solicitado ({cart.length} {cart.length === 1 ? "item" : "itens"})</h2>
              <ul className="space-y-4">
                {cart.map((item) => (
                  <li key={item.id} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-4">
                      {item.imagemUrl ? (
                        <Image src={item.imagemUrl} alt="" width={56} height={56} className="w-14 h-14 object-cover rounded-xl shadow-sm border border-gray-200 bg-white" />
                      ) : (
                        <div className="text-4xl bg-white p-2 rounded-xl border border-gray-200" aria-hidden="true">{categoryIcon(null)}</div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-lg text-gray-900 truncate">{item.nome}</p>
                        <p className="text-sm text-gray-500">Referência: {formatBRL(item.preco)} / {item.unidade} · {formatBRL(item.preco * item.qtd)}</p>
                      </div>
                      <button type="button" onClick={() => remove(item.id)} aria-label={`Tirar ${item.nome} da cotação`} className="grid h-11 w-11 place-items-center text-gray-400 hover:text-red-500 rounded-lg shrink-0">
                        <Trash2 size={20} aria-hidden="true" />
                      </button>
                    </div>
                    <div className="mt-3 flex items-center justify-between bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
                      <span className="text-sm text-gray-600 font-semibold ml-2">Quantidade ({item.unidade})</span>
                      <QuantityInput value={item.qtd} onChange={(qtd) => setQty(item.id, qtd)} min={1} max={MAX_QTD} itemName={item.nome} className="w-40 h-11 border-0 shadow-none" />
                    </div>
                  </li>
                ))}
              </ul>
            </Card>

            <Card flat className="p-6">
              <h2 className="text-lg mb-4 flex items-center gap-2"><MapPin size={20} className="text-blue-500" aria-hidden="true" /> Logística: seu endereço de entrega</h2>
              {hasAddress ? (
                <div className="text-gray-700 bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <p className="font-bold text-lg text-blue-900">{perfil.nomeFantasia}</p>
                  <p>{perfil.rua}, {perfil.numero} - {perfil.bairro}</p>
                  <p>{perfil.cidade} / {perfil.estado} - CEP: {perfil.cep}</p>
                  <Link href="/perfil" className="inline-block mt-2 text-sm font-bold text-blue-700 hover:underline">Alterar endereço</Link>
                </div>
              ) : (
                <div className="rc-banner rc-banner-amber !p-4">
                  <AlertTriangle className="shrink-0" size={20} aria-hidden="true" />
                  <p className="text-sm">Seu endereço está incompleto. Os produtores precisam dele para combinar a entrega. <Link href="/perfil" className="font-bold underline">Completar no perfil</Link></p>
                </div>
              )}
            </Card>
          </div>

          <aside aria-label="Resumo do disparo" className="md:sticky md:top-24 bg-white p-6 rounded-2xl shadow-xl border border-green-500">
            <h2 className="mb-6 flex items-center gap-2"><ShoppingCart size={20} className="text-green-600" aria-hidden="true" /> Resumo do disparo</h2>
            <div className="space-y-3 mb-6 border-b border-gray-100 pb-6 text-sm text-gray-600">
              <div className="flex justify-between"><span>Subtotal estimado</span><span>{formatBRL(total)}</span></div>
              <div className="flex justify-between items-center"><span>Taxa do sistema</span><Badge variant="success">Isento</Badge></div>
            </div>
            {/* Rótulo em cima e valor embaixo: o valor nunca quebra, mesmo com milhares (R$ 12.345,00) na coluna estreita. */}
            <div className="mb-8">
              <p className="text-gray-900 font-bold">Total estimado</p>
              <p className="whitespace-nowrap text-3xl font-black text-green-700 tabular-nums">{formatBRL(total)}</p>
            </div>
            <Button onClick={send} isLoading={sending} className="w-full h-16 text-lg shadow-lg shadow-green-200">
              {!sending && <ShieldCheck size={24} aria-hidden="true" />} {sending ? "Enviando..." : "Confirmar disparo"}
            </Button>
            <p className="mt-6 text-xs text-gray-500 bg-gray-50 p-4 rounded-xl border border-gray-100">
              O preço final nasce quando você <strong>aceitar a oferta de um produtor rural</strong>. Até lá, o valor é só uma estimativa pelo preço de referência.
            </p>
          </aside>
        </div>
      </div>
      {dialog}
    </div>
  );
}
