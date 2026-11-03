"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LogOut, User, ShieldAlert, LayoutDashboard, ChevronDown, Tractor, Store, ShieldCheck, Menu, X,
} from "lucide-react";
import { Wordmark } from "@/components/brand/Wordmark";
import { Button } from "@/components/ui/Button";
import { useSession, type ClientSession } from "@/hooks/useSession";
import { clearLegacySession, homeFor } from "@/lib/auth/client";
import { logout } from "@/lib/auth/logout";

const PUBLIC_LINKS = [
  { href: "/#sobre", label: "Sobre o Projeto" },
  { href: "/#funcionalidades", label: "Vantagens" },
  { href: "/#como-funciona", label: "Como Funciona" },
];

const ROLE_LABEL = { admin: "Administrador", produtor: "Produtor", mercado: "Mercado" } as const;

function roleLook(role: ClientSession["role"]) {
  if (role === "admin") return { icon: <ShieldCheck size={20} />, tone: "bg-amber-100 text-amber-700" };
  if (role === "produtor") return { icon: <Tractor size={20} />, tone: "bg-green-100 text-green-700" };
  return { icon: <Store size={20} />, tone: "bg-blue-100 text-blue-700" };
}

// Link principal de quem está logado (o painel da sua área).
function panelLink(role: ClientSession["role"]) {
  if (role === "admin") return { href: "/admin", label: "Central Admin", icon: <ShieldAlert size={18} />, tone: "text-amber-600 hover:text-amber-700" };
  return {
    href: homeFor(role),
    label: role === "mercado" ? "Painel de Compras" : "Painel de Vendas",
    icon: <LayoutDashboard size={18} />,
    tone: "text-gray-800 hover:text-green-600",
  };
}

export default function SiteHeader() {
  const { session, loading } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  // Cada menu guarda em qual página foi aberto: ao navegar, fecha sozinho.
  const [userMenuAt, setUserMenuAt] = useState<string | null>(null);
  const [mobileMenuAt, setMobileMenuAt] = useState<string | null>(null);
  const userMenuOpen = userMenuAt === pathname;
  const mobileMenuOpen = mobileMenuAt === pathname;
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Restos de versões antigas (token no localStorage) saem uma vez.
  useEffect(() => clearLegacySession(localStorage), []);

  useEffect(() => {
    if (!userMenuOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) setUserMenuAt(null);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setUserMenuAt(null);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [userMenuOpen]);

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  const look = session ? roleLook(session.role) : null;
  const panel = session ? panelLink(session.role) : null;

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-350 mx-auto px-4 md:px-8 h-20 flex justify-between items-center gap-4">
        {/* LOGO */}
        <Wordmark href="/" />

        {/* MENU DE NAVEGAÇÃO (computador) */}
        <nav aria-label="Principal" className="hidden md:flex items-center gap-8 font-bold text-gray-600">
          {!loading && !session && PUBLIC_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-green-600 transition">{link.label}</Link>
          ))}
          {panel && (
            <Link
              href={panel.href}
              aria-current={pathname.startsWith(panel.href) ? "page" : undefined}
              className={`flex items-center gap-2 transition ${panel.tone}`}
            >
              {panel.icon} {panel.label}
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2 sm:gap-4">
          {loading ? (
            // Reserva o espaço do botão/menu: a barra não pula quando a sessão chega.
            <div className="h-11 w-36 rounded-xl bg-gray-100 animate-pulse" aria-hidden="true" />
          ) : !session ? (
            <Button onClick={() => router.push("/login")} className="bg-green-600 hover:bg-green-700 shadow-md font-bold h-11 px-6">
              Acessar Conta
            </Button>
          ) : (
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuAt(userMenuOpen ? null : pathname)}
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
                className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded-xl transition-colors border border-transparent hover:border-gray-200"
              >
                <div className="hidden sm:block text-right">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-none mb-1">{ROLE_LABEL[session.role]}</p>
                  <p className="text-sm font-black text-gray-800 leading-none max-w-40 truncate">{session.nome}</p>
                </div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${look?.tone}`}>{look?.icon}</div>
                <ChevronDown size={16} className={`text-gray-400 transition-transform ${userMenuOpen ? "rotate-180" : ""}`} aria-hidden="true" />
                <span className="sr-only">Menu da conta de {session.nome}</span>
              </button>

              {userMenuOpen && (
                <div role="menu" className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-100 sm:hidden">
                    <p className="text-sm font-black text-gray-800 truncate">{session.nome}</p>
                    <p className="text-xs text-gray-500">{ROLE_LABEL[session.role]}</p>
                  </div>

                  {session.role !== "admin" && (
                    <Link
                      href={session.role === "produtor" ? "/produtor/perfil" : "/perfil"}
                      role="menuitem"
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-sm font-bold text-gray-700 transition-colors"
                    >
                      <User size={18} className="text-gray-400" /> Meu Perfil
                    </Link>
                  )}

                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 hover:bg-red-50 text-red-600 flex items-center gap-3 text-sm font-bold transition-colors"
                  >
                    <LogOut size={18} /> Sair da conta
                  </button>
                </div>
              )}
            </div>
          )}

          {/* BOTÃO DO MENU (celular) */}
          <button
            type="button"
            onClick={() => setMobileMenuAt(mobileMenuOpen ? null : pathname)}
            aria-expanded={mobileMenuOpen}
            aria-controls="menu-celular"
            aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
            className="md:hidden grid h-11 w-11 place-items-center rounded-xl text-gray-700 hover:bg-gray-100"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* MENU DE NAVEGAÇÃO (celular) */}
      {mobileMenuOpen && (
        <nav id="menu-celular" aria-label="Principal" className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
          {!session && PUBLIC_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="block rounded-xl px-4 py-3 font-bold text-gray-700 hover:bg-gray-50">
              {link.label}
            </Link>
          ))}
          {panel && (
            <Link href={panel.href} className={`flex items-center gap-2 rounded-xl px-4 py-3 font-bold hover:bg-gray-50 ${panel.tone}`}>
              {panel.icon} {panel.label}
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}
