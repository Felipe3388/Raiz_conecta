"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Leaf,
  LogOut,
  User,
  ShieldAlert,
  LayoutDashboard,
  ChevronDown,
  Moon,
  Tractor,
  Store,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function SiteHeader() {
  const [role, setRole] = useState<string | null>(null);
  const [nome, setNome] = useState<string | null>(null);
  const [menuAberto, setMenuAberto] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const pathname = usePathname();
  const router = useRouter();

  // useCallback evita que a função seja recriada a cada render
  // e permite usá-la como dependência segura no useEffect
  const carregarUsuario = useCallback(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setRole(null);
      setNome(null);
      return;
    }
    setRole(localStorage.getItem("userRole"));
    setNome(localStorage.getItem("userName"));
  }, []); // sem dependências — só lê localStorage

  useEffect(() => {
    carregarUsuario();
    window.addEventListener("storage", carregarUsuario);
    window.addEventListener("loginStateChange", carregarUsuario);
    return () => {
      window.removeEventListener("storage", carregarUsuario);
      window.removeEventListener("loginStateChange", carregarUsuario);
    };
  }, [pathname, carregarUsuario]); // carregarUsuario estável via useCallback

  useEffect(() => {
    const handleClickFora = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuAberto(false);
      }
    };
    document.addEventListener("mousedown", handleClickFora);
    return () => document.removeEventListener("mousedown", handleClickFora);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    setRole(null);
    setNome(null);
    document.cookie = "token=; path=/; max-age=0;";
    window.dispatchEvent(new Event("loginStateChange"));
    router.push("/login");
  };

  const getIconeEPerfilCor = () => {
    if (role === "admin")
      return { icone: <ShieldCheck size={20} />, cor: "bg-amber-100 text-amber-700" };
    if (role === "produtor")
      return { icone: <Tractor size={20} />, cor: "bg-green-100 text-green-700" };
    if (role === "mercado")
      return { icone: <Store size={20} />, cor: "bg-blue-100 text-blue-700" };
    return { icone: <User size={20} />, cor: "bg-gray-100 text-gray-700" };
  };

  const { icone, cor } = getIconeEPerfilCor();

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
              <Link href="/#funcionalidades" className="hover:text-green-600 transition">
                Vantagens
              </Link>
              <Link href="/#como-funciona" className="hover:text-green-600 transition">
                Como Funciona
              </Link>
            </>
          )}

          {(role === "mercado" || role === "produtor") && (
            <Link
              href={role === "mercado" ? "/catalogo" : "/produtor"}
              className="flex items-center gap-2 hover:text-green-600 transition text-gray-800"
            >
              <LayoutDashboard size={18} />
              {role === "mercado" ? "Painel de Compras" : "Painel de Vendas"}
            </Link>
          )}

          {role === "admin" && (
            <Link
              href="/admin"
              className="flex items-center gap-2 text-amber-600 hover:text-amber-700 transition"
            >
              <ShieldAlert size={18} /> Central Admin
            </Link>
          )}
        </nav>

        {/* BOTÕES DA DIREITA & DROPDOWN */}
        <div className="flex items-center gap-4">
          {!role ? (
            <Button
              onClick={() => router.push("/login")}
              className="bg-green-600 hover:bg-green-700 shadow-md font-bold h-11 px-6"
            >
              Acessar Conta
            </Button>
          ) : (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuAberto(!menuAberto)}
                className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded-xl transition-colors border border-transparent hover:border-gray-200"
              >
                <div className="hidden sm:block text-right">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-none mb-1">
                    {role}
                  </p>
                  <p className="text-sm font-black text-gray-800 leading-none">
                    {nome || "Usuário"}
                  </p>
                </div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${cor}`}>
                  {icone}
                </div>
                <ChevronDown
                  size={16}
                  className={`text-gray-400 transition-transform ${menuAberto ? "rotate-180" : ""}`}
                />
              </button>

              {menuAberto && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-3 border-b border-gray-100 sm:hidden">
                    <p className="text-sm font-black text-gray-800">{nome}</p>
                    <p className="text-xs text-gray-500 capitalize">{role}</p>
                  </div>

                  <Link
                    href="/perfil"
                    onClick={() => setMenuAberto(false)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-sm font-bold text-gray-700 transition-colors"
                  >
                    <User size={18} className="text-gray-400" /> Meu Perfil
                  </Link>

                  <button
                    onClick={() => {}}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-sm font-bold text-gray-700 transition-colors"
                  >
                    <Moon size={18} className="text-gray-400" /> Modo Escuro
                    <span className="ml-auto text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md">
                      Em breve
                    </span>
                  </button>

                  <hr className="my-1 border-gray-100" />

                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 hover:bg-red-50 text-red-600 flex items-center gap-3 text-sm font-bold transition-colors"
                  >
                    <LogOut size={18} /> Sair da conta
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
