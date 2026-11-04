import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight, type LucideIcon } from "lucide-react";

// Lista agrupada no estilo da aba Mais do app (SettingsGroup/SettingsRow): título de seção e linhas altas.
export function ListGroup({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      {title && <h2 className="px-1 !font-sans !text-sm !font-semibold !text-gray-600 !tracking-normal">{title}</h2>}
      <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">{children}</div>
    </section>
  );
}

interface ListRowProps {
  icon: LucideIcon;
  label: string;
  hint?: string;
  href?: string;
  onClick?: () => void;
  tone?: "default" | "danger";
}

// Uma linha da lista: leva a outra tela (href) ou faz uma ação (onClick). Altura mínima de 56 px, como no app.
export function ListRow({ icon: Icon, label, hint, href, onClick, tone = "default" }: ListRowProps) {
  const danger = tone === "danger";
  const content = (
    <>
      <Icon size={20} className={`${danger ? "text-red-600" : "text-green-700"} shrink-0`} aria-hidden="true" />
      <span className="flex-1 min-w-0 text-left">
        <span className={`block font-bold ${danger ? "text-red-700" : "text-gray-900"}`}>{label}</span>
        {hint && <span className="block text-sm text-gray-500">{hint}</span>}
      </span>
      {!danger && <ChevronRight size={18} className="text-gray-400 shrink-0" aria-hidden="true" />}
    </>
  );
  const className = `w-full min-h-14 flex items-center gap-4 px-5 py-4 transition-colors ${danger ? "hover:bg-red-50" : "hover:bg-gray-50"}`;
  return href ? (
    <Link href={href} className={className}>{content}</Link>
  ) : (
    <button type="button" onClick={onClick} className={className}>{content}</button>
  );
}
