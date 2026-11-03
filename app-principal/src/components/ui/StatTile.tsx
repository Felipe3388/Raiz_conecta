import Link from "next/link";
import type { LucideIcon } from "lucide-react";

// Um número do Painel que leva à tela dele ("Para responder", "Ofertas feitas", "No catálogo").
export function StatTile({ icon: Icon, value, label, href }: { icon: LucideIcon; value: number; label: string; href: string }) {
  return (
    <Link
      href={href}
      className="flex-1 min-w-0 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col items-center gap-1 text-center transition-all hover:shadow-md hover:-translate-y-0.5"
    >
      <Icon size={22} className="text-green-700" />
      <span className="text-3xl font-black text-gray-900 tabular-nums">{value}</span>
      <span className="text-xs font-bold text-gray-500">{label}</span>
    </Link>
  );
}
