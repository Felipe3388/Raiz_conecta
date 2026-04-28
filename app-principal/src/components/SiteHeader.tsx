"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Leaf, LogOut, User, ShieldAlert, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function SiteHeader() {
  const [role, setRole] = useState<string | null>(null);
  const [nome, setNome] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  // Função que lê quem está logado no navegador
  const carregarUsuario = () => {
    setRole(localStorage.getItem("userRole"));
    setNome(localStorage.getItem("userName"));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    carregarUsuario();

    // Escuta mudanças de aba e de login para atualizar sozinho

    window.addEventListener("storage", carregarUsuario);
    window.addEventListener("loginStateChange", carregarUsuario);
    return () => {
      window.removeEventListener("storage", carregarUsuario);
      window.removeEventListener("loginStateChange", carregarUsuario);
    };
  }, [pathname]);

  const handleLogout = () => {
    localStorage.clear();
    setRole(null);
    setNome(null);
    window.dispatchEvent(new Event("loginStateChange"));
    router.push("/login");
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm transition-all">
      <div className="max-w-350 mx-auto px-4 md:px-8 h-20 flex justify-between items-center">

        {/* LOGO */}

        <Link href="/" className="flex items-center gap-2 group">
          <div className="bg-green-100 p-2 rounded-xl group-hover:bg-green-600 transition-colors">
            <Leaf
              className="text-green-600 group-hover:text-white transition-colors"
              size={28}
            />
          </div>
          <span className="text-2xl font-black text-gray-900 tracking-tight">
            Raiz<span className="text-green-600">Conecta</span>
          </span>
        </Link>

        {/* MENUS DINÂMICOS */}

        <nav className="hidden md:flex items-center gap-8 font-bold text-gray-600">
          {!role && (
            <>
              <Link href="/#sobre" className="hover:text-green-600 transition">
                Sobre o Projeto
              </Link>
              <Link
                href="/#funcionalidades"
                className="hover:text-green-600 transition"
              >
                Vantagens
              </Link>
              <Link
                href="/#como-funciona"
                className="hover:text-green-600 transition"
              >
                Como Funciona
              </Link>
            </>
          )}

          {/* Se for Mercado ou Produtor, mostra link rápido para o Painel e Perfil */}

          {(role === "mercado" || role === "produtor") && (
            <>
              <Link
                href={role === "mercado" ? "/catalogo" : "/produtor"}
                className="flex items-center gap-2 hover:text-green-600 transition text-gray-800"
              >
                <LayoutDashboard size={18} />{" "}
                {role === "mercado" ? "Painel de Compras" : "Painel de Vendas"}
              </Link>
              <Link
                href="/perfil"
                className="flex items-center gap-2 hover:text-green-600 transition text-gray-800"
              >
                <User size={18} /> Meu Perfil
              </Link>
            </>
          )}

          {/* Se for Admin */}

          {role === "admin" && (
            <Link
              href="/admin"
              className="flex items-center gap-2 text-amber-600 hover:text-amber-700 transition"
            >
              <ShieldAlert size={18} /> Central Admin
            </Link>
          )}
        </nav>

        {/* BOTÕES DA DIREITA */}
        
        <div className="flex items-center gap-4">
          {!role ? (
            <>
              <Link
                href="/login"
                className="font-bold text-green-700 hover:text-green-800 transition hidden sm:block"
              >
                Entrar
              </Link>
              <Button
                onClick={() => router.push("/login")}
                className="bg-green-600 hover:bg-green-700 shadow-md font-bold h-11 px-6"
              >
                Criar Conta
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <div className="hidden sm:block text-right">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  {role}
                </p>
                <p className="text-sm font-black text-gray-800">
                  {nome || "Usuário"}
                </p>
              </div>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="border-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 h-10 transition-colors"
              >
                <LogOut size={18} className="mr-2" /> Sair
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
