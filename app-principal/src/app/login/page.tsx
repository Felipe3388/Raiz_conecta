"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  LogIn, UserPlus, Mail, Lock, User, Building2, Clock,
  ArrowLeft, Eye, EyeOff, AlertCircle, Loader2, Leaf,
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [view, setView] = useState<"login" | "cadastro" | "em_analise">("login");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [mostrarSenhaLogin, setMostrarSenhaLogin] = useState(false);
  const [mostrarSenhaCadastro, setMostrarSenhaCadastro] = useState(false);

  const [formLogin, setFormLogin] = useState({ email: "", senha: "" });
  const [formCadastro, setFormCadastro] = useState({
    tipoUsuario: "produtor",
    nome: "",
    email: "",
    senha: "",
  });

  useEffect(() => {
    if (searchParams.get("modo") === "cadastro") setView("cadastro");
  }, [searchParams]);

  // Limpa erro ao trocar de aba
  const trocarView = useCallback((novaView: "login" | "cadastro") => {
    setView(novaView);
    setErro("");
  }, []);

  const tabs = [
    { id: "login", label: "Entrar", icon: LogIn },
    { id: "cadastro", label: "Criar Conta", icon: UserPlus },
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    if (!formLogin.email || !formLogin.senha) {
      setErro("Preencha o e-mail e a senha.");
      return;
    }
    setCarregando(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formLogin),
      });
      const data = await res.json();

      if (!res.ok) {
        setErro(data.error || "Erro ao fazer login.");
        return;
      }

      if (data.user.status === "EM_ANALISE") {
        setView("em_analise");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("userEmail", data.user.email);
      localStorage.setItem("userName", data.user.nome);
      localStorage.setItem("userRole", data.user.tipoUser);
      window.dispatchEvent(new Event("loginStateChange"));
      toast.success(`Bem-vindo de volta, ${data.user.nome}!`);

      const destinos: Record<string, string> = {
        admin: "/admin",
        produtor: "/produtor",
        mercado: "/catalogo",
      };
      router.push(destinos[data.user.tipoUser] || "/");
    } catch {
      setErro("Erro de conexão com o servidor.");
    } finally {
      setCarregando(false);
    }
  };

  const handleCadastroPasso1 = (e: React.FormEvent) => {
    e.preventDefault();
    sessionStorage.setItem("cadastro_temporario", JSON.stringify(formCadastro));
    router.push("/completar-perfil");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex flex-col items-center justify-center p-4 md:p-8 overflow-hidden">

      {/* LOGO */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center mb-8"
      >
        <Link href="/" className="inline-flex items-center gap-2 group">
          <div className="bg-green-100 p-2.5 rounded-xl group-hover:bg-green-600 transition-colors">
            <Leaf className="text-green-600 group-hover:text-white transition-colors" size={28} />
          </div>
          <span className="text-3xl font-black text-gray-900">
            Raiz<span className="text-green-600">Conecta</span>
          </span>
        </Link>
        <AnimatePresence mode="wait">
          <motion.p
            key={view}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="text-gray-500 mt-3 text-sm"
          >
            {view === "cadastro"
              ? "Crie sua conta para começar"
              : view === "em_analise"
              ? "Aguardando aprovação"
              : "Acesse sua conta para continuar"}
          </motion.p>
        </AnimatePresence>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="w-full max-w-[480px]"
      >
        {/* Sem hover lift no card de login — é um form, não um item de lista */}
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">

          {/* ABAS */}
          {view !== "em_analise" && (
            <div className="p-1.5 bg-gray-100/80 rounded-full flex gap-1 relative m-6 mb-0 border border-gray-200">
              {tabs.map((tab) => {
                const isActive = view === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => trocarView(tab.id as "login" | "cadastro")}
                    className={`flex-1 relative z-10 px-4 py-2.5 rounded-full text-sm font-bold flex items-center justify-center gap-2 transition-colors duration-300 ${
                      isActive ? "text-green-700" : "text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTabPill"
                        className="absolute inset-0 bg-white rounded-full shadow-md"
                        transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
                      />
                    )}
                    <tab.icon size={16} className="relative z-10" />
                    <span className="relative z-10">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="p-8 md:p-10 relative min-h-[400px] flex flex-col justify-center">
            <AnimatePresence mode="wait">

              {/* ── LOGIN ── */}
              {view === "login" && (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: -24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 24 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6"
                >
                  <h1 className="text-2xl font-black text-gray-950 text-center">Entrar na conta</h1>

                  <form onSubmit={handleLogin} className="space-y-5">
                    {erro && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm"
                      >
                        <AlertCircle size={16} className="shrink-0" />
                        {erro}
                      </motion.div>
                    )}

                    <Input
                      label="E-mail"
                      name="email"
                      type="email"
                      icon={Mail}
                      placeholder="seu@email.com"
                      value={formLogin.email}
                      onChange={(e) => setFormLogin({ ...formLogin, email: e.target.value })}
                      disabled={carregando}
                      required
                    />

                    {/* Senha com olho */}
                    <div className="space-y-1.5 w-full">
                      <label className="text-sm font-semibold text-gray-700 block">Senha</label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                          <Lock size={18} />
                        </div>
                        <input
                          type={mostrarSenhaLogin ? "text" : "password"}
                          value={formLogin.senha}
                          onChange={(e) => setFormLogin({ ...formLogin, senha: e.target.value })}
                          placeholder="••••••••"
                          className="w-full pl-10 pr-11 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 bg-white text-sm outline-none transition-all"
                          disabled={carregando}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setMostrarSenhaLogin(!mostrarSenhaLogin)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          tabIndex={-1}
                        >
                          {mostrarSenhaLogin ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <div className="text-right">
                      <button
                        type="button"
                        onClick={() => toast.info("A recuperação de senha estará disponível em breve. Para urgências, contate o suporte.")}
                        className="text-xs text-gray-400 hover:text-gray-600 font-medium transition-colors"
                      >
                        Esqueceu a senha?
                      </button>
                    </div>

                    <Button type="submit" isLoading={carregando} className="w-full h-12 text-base">
                      Acessar Painel
                    </Button>
                  </form>
                </motion.div>
              )}

              {/* ── CADASTRO ── */}
              {view === "cadastro" && (
                <motion.div
                  key="cadastro"
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6"
                >
                  <h1 className="text-2xl font-black text-gray-950 text-center">Junte-se a nós</h1>

                  <form onSubmit={handleCadastroPasso1} className="space-y-5">
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Building2 size={16} /> Tipo de Perfil
                      </label>
                      <select
                        value={formCadastro.tipoUsuario}
                        onChange={(e) => setFormCadastro({ ...formCadastro, tipoUsuario: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 bg-white text-sm outline-none"
                      >
                        <option value="produtor">Sou Produtor Rural</option>
                        <option value="mercado">Sou Mercado / Supermercado</option>
                      </select>
                    </div>

                    <Input
                      label="Nome Fantasia / Razão Social"
                      name="nome"
                      type="text"
                      icon={User}
                      placeholder="Fazenda Imaginária"
                      value={formCadastro.nome}
                      onChange={(e) => setFormCadastro({ ...formCadastro, nome: e.target.value })}
                      required
                    />
                    <Input
                      label="E-mail"
                      name="email"
                      type="email"
                      icon={Mail}
                      placeholder="seu@email.com"
                      value={formCadastro.email}
                      onChange={(e) => setFormCadastro({ ...formCadastro, email: e.target.value })}
                      required
                    />

                    <div className="space-y-1.5 w-full">
                      <label className="text-sm font-semibold text-gray-700 block">Senha</label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                          <Lock size={18} />
                        </div>
                        <input
                          type={mostrarSenhaCadastro ? "text" : "password"}
                          value={formCadastro.senha}
                          onChange={(e) => setFormCadastro({ ...formCadastro, senha: e.target.value })}
                          placeholder="Crie uma senha forte"
                          className="w-full pl-10 pr-11 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 bg-white text-sm outline-none transition-all"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setMostrarSenhaCadastro(!mostrarSenhaCadastro)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          tabIndex={-1}
                        >
                          {mostrarSenhaCadastro ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <label className="flex items-start gap-2.5 text-xs text-gray-600 pt-1 cursor-pointer">
                      <input type="checkbox" className="mt-0.5 accent-green-600 rounded" required />
                      <span>
                        Li e concordo com os{" "}
                        <a href="#" className="text-green-600 font-bold hover:underline">Termos de Uso</a>{" "}
                        e{" "}
                        <a href="#" className="text-green-600 font-bold hover:underline">Política de Privacidade</a>.
                      </span>
                    </label>

                    <Button type="submit" className="w-full h-12 text-base">
                      Avançar para o Passo 2
                    </Button>
                  </form>
                </motion.div>
              )}

              {/* ── EM ANÁLISE ── */}
              {view === "em_analise" && (
                <motion.div
                  key="em_analise"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.4, type: "spring" }}
                  className="text-center space-y-6 py-4"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.2, bounce: 0.5 }}
                    className="mx-auto w-24 h-24 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center"
                  >
                    <Clock size={48} className="animate-pulse" />
                  </motion.div>

                  <div className="space-y-3">
                    <h1 className="text-3xl font-black text-gray-900">Conta em Análise</h1>
                    <p className="text-gray-500 leading-relaxed px-4 text-sm">
                      Sua documentação está sendo verificada. Fique de olho no seu{" "}
                      <strong className="text-gray-900">e-mail</strong> — avisaremos assim que seu acesso for liberado!
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => { setView("login"); setFormLogin({ email: "", senha: "" }); }}
                    className="w-full border-gray-300 text-gray-600 hover:bg-gray-50"
                  >
                    <ArrowLeft size={18} className="mr-2" /> Voltar para o Login
                  </Button>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* RODAPÉ */}
          {view !== "em_analise" && (
            <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 text-center text-xs text-gray-500">
              Precisa de ajuda?{" "}
              <a href="mailto:suporte@raizconecta.com.br" className="text-green-600 font-bold hover:underline">
                Fale com o suporte.
              </a>
            </div>
          )}
        </div>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center text-xs text-gray-400 mt-6"
      >
        Ao acessar, você concorda com nossos termos de uso.
      </motion.p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="animate-spin text-green-600" size={32} />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
