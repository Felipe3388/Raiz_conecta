import Link from "next/link";
import type { LucideIcon } from "lucide-react";

// Um número que leva à tela dele ("Para responder", "Ofertas feitas", "No catálogo").
export function StatTile({ icon: Icon, value, label, href }: { icon: LucideIcon; value: number; label: string; href: string }) {
  return (
    <Link href={href} className="min-w-0 bg-white rounded-2xl border border-gray-200 p-4 md:p-5 flex flex-col gap-2 hover:border-green-600 transition-colors">
      <Icon size={20} className="text-green-700" aria-hidden="true" />
      <span className="font-display text-3xl md:text-4xl font-extrabold text-gray-900 tabular-nums leading-none">{value}</span>
      <span className="text-sm font-semibold text-gray-600 leading-tight">{label}</span>
    </Link>
  );
}
