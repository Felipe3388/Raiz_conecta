"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, MoreHorizontal, Package, Sprout, ListChecks, type LucideIcon } from "lucide-react";
import { activeNavId, badgeLabel, PRODUCER_NAV, type ProducerNavItem } from "@/lib/produtor/nav";
import { useProdutor } from "./ProdutorProvider";

const ICONS: Record<ProducerNavItem["id"], LucideIcon> = {
  catalogo: Sprout,
  ofertas: ListChecks,
  inicio: LayoutDashboard,
  entregas: Package,
  mais: MoreHorizontal,
};

// A moldura da área do Produtor: menu lateral no computador e barra de abas embaixo no celular, com os mesmos nomes
// e a mesma ordem do app (o botão Início fica no meio, um pouco acima das outras abas).
export function ProdutorShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const active = activeNavId(pathname);
  const { mural } = useProdutor();
  const waiting = mural?.resumo.paraResponder ?? 0;

  const badgeFor = (item: ProducerNavItem) => (item.id === "ofertas" && waiting > 0 ? waiting : null);
  const labelFor = (item: ProducerNavItem) =>
    item.id === "ofertas" ? badgeLabel(item.label, waiting, "pedido para responder", "pedidos para responder") : item.label;

  // No computador a ordem é a de uso (Início primeiro); a barra de baixo mantém a ordem do app.
  const sidebar = [...PRODUCER_NAV].sort((a, b) => Number(!!b.home) - Number(!!a.home));

  return (
    <div className="rc-page">
      <div className="max-w-350 mx-auto px-4 md:px-8 py-6 lg:py-8 flex gap-8 items-start">
        <aside className="hidden lg:block w-60 shrink-0 sticky top-28">
          <nav aria-label="Área do produtor" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-2 space-y-1">
            {sidebar.map((item) => {
              const Icon = ICONS[item.id];
              const isActive = active === item.id;
              const badge = badgeFor(item);
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  aria-label={labelFor(item)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-colors ${
                    isActive ? "bg-green-50 text-green-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <Icon size={19} />
                  <span className="flex-1">{item.label}</span>
                  {badge !== null && <span className="rc-tab-badge">{badge}</span>}
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="flex-1 min-w-0 pb-28 lg:pb-0">{children}</div>
      </div>

      <nav
        aria-label="Área do produtor"
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]"
      >
        <ul className="max-w-xl mx-auto grid grid-cols-5 items-end px-2 pb-[env(safe-area-inset-bottom)]">
          {PRODUCER_NAV.map((item) => {
            const Icon = ICONS[item.id];
            const isActive = active === item.id;
            const badge = badgeFor(item);
            if (item.home) {
              return (
                <li key={item.id} className="flex justify-center">
                  <Link
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className="-mt-5 flex flex-col items-center gap-1 pb-2"
                  >
                    <span
                      className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg ring-4 ring-white transition-transform active:scale-95 ${
                        isActive ? "bg-green-700" : "bg-green-600"
                      }`}
                    >
                      <Icon size={26} />
                    </span>
                    <span className={`text-[11px] font-bold ${isActive ? "text-green-700" : "text-gray-500"}`}>{item.label}</span>
                  </Link>
                </li>
              );
            }
            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  aria-label={labelFor(item)}
                  className={`relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-bold ${
                    isActive ? "text-green-700" : "text-gray-500"
                  }`}
                >
                  <span className="relative">
                    <Icon size={22} />
                    {badge !== null && (
                      <span className="absolute -top-1.5 -right-3 min-w-4 h-4 px-1 rounded-full bg-amber-500 text-white text-[10px] leading-4 text-center">
                        {badge}
                      </span>
                    )}
                  </span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
