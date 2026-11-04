"use client";

import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import { useSession } from "@/hooks/useSession";
import { homeFor } from "@/lib/auth/client";

// Os botões principais da página: quem já entrou vai direto ao painel; quem não entrou escolhe o tipo de conta.
export function LandingActions({ tone = "light" }: { tone?: "light" | "dark" }) {
  const { session, loading } = useSession();
  const secondary =
    tone === "dark"
      ? "border-2 border-green-300/60 text-white hover:bg-white/10"
      : "border-2 border-gray-300 text-gray-900 hover:border-green-600 hover:text-green-800 bg-white";
  const primary = tone === "dark" ? "bg-white text-green-900 hover:bg-green-50" : "bg-green-600 text-white hover:bg-green-700";
  const base = "inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl font-bold transition-colors";

  if (loading) return <div className="h-12" aria-hidden="true" />;
  if (session) {
    return (
      <Link href={homeFor(session.role)} className={`${base} ${primary}`}>
        <LayoutDashboard size={18} aria-hidden="true" /> Abrir meu painel
      </Link>
    );
  }
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <Link href="/login?modo=cadastro&tipo=mercado" className={`${base} ${primary}`}>Criar conta de mercado</Link>
      <Link href="/login?modo=cadastro&tipo=produtor" className={`${base} ${secondary}`}>Criar conta de produtor</Link>
    </div>
  );
}
