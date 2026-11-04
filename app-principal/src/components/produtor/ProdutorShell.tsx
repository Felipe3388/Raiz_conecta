"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ListChecks, MoreHorizontal, Package, Scale, Sprout, User, type LucideIcon } from "lucide-react";
import { initialOf } from "@/lib/produtor/greeting";
import { activeNavId, badgeLabel, PRODUCER_NAV, type ProducerNavItem } from "@/lib/produtor/nav";
import { useProdutor } from "./ProdutorProvider";

const ICONS: Record<ProducerNavItem["id"], LucideIcon> = {
  catalogo: Sprout,
  ofertas: ListChecks,
  inicio: LayoutDashboard,
  entregas: Package,
  mais: MoreHorizontal,
};

const isAt = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);

function SideLink({ href, icon: Icon, label, hint, badge, current, ariaLabel }: {
  href: string;
  icon: LucideIcon;
  label: string;
  hint?: string;
  badge?: number | null;
  current: boolean;
  ariaLabel?: string;
}) {
  return (
    <Link
      href={href}
      aria-current={current ? "page" : undefined}
      aria-label={ariaLabel}
      className={`flex items-center gap-3 px-3 min-h-11 py-2 rounded-xl text-[15px] transition-colors ${
        current ? "bg-green-50 text-green-800 font-bold" : "text-gray-700 font-semibold hover:bg-gray-100"
      }`}
    >
      <Icon size={19} className={current ? "text-green-700" : "text-gray-500"} aria-hidden="true" />
      <span className="flex-1 min-w-0">
        <span className="block truncate">{label}</span>
        {hint && <span className="block text-xs font-medium text-gray-500 truncate">{hint}</span>}
      </span>
      {badge ? <span className="min-w-6 h-6 px-1.5 rounded-full bg-milho text-gray-900 text-xs font-bold grid place-items-center">{badge}</span> : null}
    </Link>
  );
}

// A moldura da área do produtor. No computador: menu lateral com quem está logado, as telas do dia a dia e, abaixo,
// a balança e o perfil (no app eles ficam dentro do Mais). No celular: a barra de abas do app, com o Início no meio.
export function ProdutorShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const active = activeNavId(pathname);
  const { produtor, mural, scales } = useProdutor();
  const waiting = mural?.resumo.paraResponder ?? 0;

  const badgeFor = (item: ProducerNavItem) => (item.id === "ofertas" && waiting > 0 ? waiting : null);
  const labelFor = (item: ProducerNavItem) =>
    item.id === "ofertas" ? badgeLabel(item.label, waiting, "pedido para responder", "pedidos para responder") : item.label;

  // No computador o Início vem primeiro e o Mais fica junto das opções da conta.
  const daily = [...PRODUCER_NAV].filter((item) => item.id !== "mais").sort((a, b) => Number(!!b.home) - Number(!!a.home));
  const place = [produtor.cidade, produtor.estado].filter(Boolean).join(", ");
  const scaleHint = scales.state ? (scales.activeName ?? "Não conectada") : undefined;

  return (
    <div className="rc-page">
      <div className="max-w-350 mx-auto px-4 md:px-8 py-6 lg:py-8 flex gap-8 items-start">
        <aside className="hidden lg:flex flex-col gap-4 w-64 shrink-0 sticky top-24" aria-label="Área do produtor">
          <Link href="/produtor/perfil" className="flex items-center gap-3 px-3 py-2 rounded-2xl hover:bg-white transition-colors">
            <span className="grid place-items-center w-11 h-11 rounded-full bg-green-600 text-white font-display font-bold text-lg" aria-hidden="true">
              {initialOf(produtor.nomeFantasia)}
            </span>
            <span className="min-w-0">
              <span className="block font-bold text-gray-900 truncate">{produtor.nomeFantasia ?? "Produtor"}</span>
              <span className="block text-sm text-gray-500 truncate">{place || produtor.email}</span>
            </span>
          </Link>

          <nav aria-label="Telas do produtor" className="space-y-0.5">
            {daily.map((item) => (
              <SideLink key={item.id} href={item.href} icon={ICONS[item.id]} label={item.label} badge={badgeFor(item)} current={active === item.id} ariaLabel={labelFor(item)} />
            ))}
          </nav>

          <div className="h-px bg-gray-200 mx-3" aria-hidden="true" />

          <nav aria-label="Conta" className="space-y-0.5">
            <SideLink href="/produtor/balancas" icon={Scale} label="Minha balança" hint={scaleHint} current={isAt(pathname, "/produtor/balancas")} />
            <SideLink href="/produtor/perfil" icon={User} label="Meu Perfil" current={isAt(pathname, "/produtor/perfil")} />
            <SideLink href="/produtor/mais" icon={MoreHorizontal} label="Mais" current={pathname === "/produtor/mais"} />
          </nav>
        </aside>

        <div className="flex-1 min-w-0 pb-28 lg:pb-0">{children}</div>
      </div>

      <nav
        aria-label="Área do produtor"
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/90 backdrop-blur-md border-t border-gray-200"
      >
        <ul className="max-w-xl mx-auto grid grid-cols-5 items-end px-2 pb-[env(safe-area-inset-bottom)]">
          {PRODUCER_NAV.map((item) => {
            const Icon = ICONS[item.id];
            const isActive = active === item.id;
            const badge = badgeFor(item);
            if (item.home) {
              return (
                <li key={item.id} className="flex justify-center">
                  <Link href={item.href} aria-current={isActive ? "page" : undefined} className="-mt-5 flex flex-col items-center gap-1 pb-2">
                    <span
                      className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg ring-4 ring-white transition-transform active:scale-95 ${
                        isActive ? "bg-green-700" : "bg-green-600"
                      }`}
                    >
                      <Icon size={26} aria-hidden="true" />
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
                  className={`relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-bold ${isActive ? "text-green-700" : "text-gray-500"}`}
                >
                  <span className="relative">
                    <Icon size={22} aria-hidden="true" />
                    {badge !== null && (
                      <span className="absolute -top-1.5 -right-3 min-w-4 h-4 px-1 rounded-full bg-milho text-gray-900 text-[10px] leading-4 text-center">{badge}</span>
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
