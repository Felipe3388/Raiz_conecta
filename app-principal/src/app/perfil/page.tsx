/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  User, MapPin, Lock, Save, Loader2, ArrowLeft,
  AlertTriangle, Trash2, ShieldCheck, Headset,
} from "lucide-react";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

// Variantes de animação reutilizáveis
const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35 },
};

// Seção de card com header colorido — componente local
function SectionCard({
  icon: Icon,
  iconBg,
  iconColor,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden bg-white shadow-sm border-gray-200 hover:shadow-md transition-shadow">
      <div className="bg-gray-50/50 p-6 md:p-8 border-b border-gray-100 flex gap-5 items-start">
        <div className={`${iconBg} ${iconColor} p-3.5 rounded-2xl shadow-sm shrink-0`}>
          <Icon size={28} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <p className="text-gray-500 text-sm mt-1 leading-relaxed">{description}</p>
        </div>
      </div>
      <div className="p-6 md:p-8">{children}</div>
    </Card>
  );
}

export default function MeuPerfil() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  const [form, setForm] = useState<any>({});
  const [senhaNova, setSenhaNova] = useState("");
  const [senhaConfirmar, setSenhaConfirmar] = useState("");

  // Estado dos modais
  const [modalSalvar, setModalSalvar] = useState(false);
  const [modalExcluir, setModalExcluir] = useState(false);

  const carregarDados = useCallback(async () => {
    const email = localStorage.getItem("userEmail");
    if (!email) { router.push("/login"); return; }
    try {
      const res = await fetch(`/api/perfil/meus-dados?email=${email}`);
      if (res.ok) setForm(await res.json());
      else router.push("/login");
    } catch {
      toast.error("Erro ao carregar os dados do perfil.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { carregarDados(); }, [carregarDados]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const confirmarSalvar = async () => {
    if (senhaNova || senhaConfirmar) {
      if (senhaNova !== senhaConfirmar) {
        toast.warning("As senhas não coincidem!");
        setModalSalvar(false);
        return;
      }
      if (senhaNova.length < 6) {
        toast.warning("A nova senha deve ter pelo menos 6 caracteres.");
        setModalSalvar(false);
        return;
      }
    }

    setSalvando(true);
    try {
      const payload = { ...form, novaSenha: senhaNova || undefined };
      const res = await fetch("/api/perfil/meus-dados", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("Perfil atualizado com sucesso!");
        setSenhaNova("");
        setSenhaConfirmar("");
        if (form.nomeFantasia) {
          localStorage.setItem("userName", form.nomeFantasia);
          window.dispatchEvent(new Event("loginStateChange"));
        }
      } else {
        toast.error("Erro ao atualizar os dados.");
      }
    } catch {
      toast.error("Erro de conexão com o servidor.");
    } finally {
      setSalvando(false);
      setModalSalvar(false);
    }
  };

  const confirmarExcluir = async () => {
    setExcluindo(true);
    try {
      const res = await fetch(`/api/perfil/meus-dados?email=${form.email}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Conta excluída. Sentiremos sua falta!");
        localStorage.clear();
        document.cookie = "token=; path=/; max-age=0;";
        router.push("/login");
      } else {
        toast.error("Não foi possível excluir a conta.", {
          description: "Pode haver histórico de pedidos vinculados a ela.",
        });
        setModalExcluir(false);
      }
    } catch {
      toast.error("Erro de conexão.");
      setModalExcluir(false);
    } finally {
      setExcluindo(false);
    }
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center gap-3 text-green-700 bg-[#F8FAFC]">
        <Loader2 className="animate-spin" size={40} />
        <span className="font-bold text-sm text-gray-500">Carregando perfil...</span>
      </div>
    );
  }

  const isProdutor = form.tipoUser === "produtor";
  const labelPerfil = isProdutor ? "Produtor Rural" : "Mercado";

  return (
    <>
      {/* Modal de confirmação — Salvar */}
      <ConfirmModal
        isOpen={modalSalvar}
        onClose={() => setModalSalvar(false)}
        onConfirm={confirmarSalvar}
        title="Salvar alterações?"
        description="As mudanças serão aplicadas imediatamente ao seu perfil na plataforma."
        confirmLabel="Sim, salvar"
        cancelLabel="Revisar"
        variant="success"
        isLoading={salvando}
      />

      {/* Modal de confirmação — Excluir conta */}
      <ConfirmModal
        isOpen={modalExcluir}
        onClose={() => setModalExcluir(false)}
        onConfirm={confirmarExcluir}
        title="Excluir conta?"
        description="Esta ação é irreversível. Todos os seus dados serão apagados permanentemente do sistema."
        confirmLabel="Sim, excluir tudo"
        cancelLabel="Cancelar"
        variant="danger"
        isLoading={excluindo}
      />

      <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 pb-24">
        <div className="max-w-200 mx-auto space-y-6">

          {/* CABEÇALHO */}
          <motion.div {...fadeUp} className="mb-2 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <Button
                onClick={() => router.back()}
                variant="ghost"
                className="flex items-center text-gray-500 hover:text-green-700 font-bold mb-4 px-0 h-auto shadow-none hover:shadow-none"
              >
                <ArrowLeft className="mr-2" size={18} /> Voltar
              </Button>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                Configurações da Conta
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <Badge variant={isProdutor ? "success" : "neutral"} className="shadow-sm">
                  Perfil: {labelPerfil}
                </Badge>
              </div>
            </div>

            <Button
              onClick={() => toast.info("O chat de suporte estará disponível em breve! Para urgências: suporte@raizconecta.com.br")}
              variant="outline"
              className="bg-white border-gray-200 text-gray-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 shadow-sm"
            >
              <Headset size={18} className="mr-2" /> Falar com Suporte
            </Button>
          </motion.div>

          {/* CARD 1 — DADOS GERAIS */}
          <motion.div {...fadeUp} transition={{ delay: 0.05, duration: 0.35 }}>
            <SectionCard
              icon={User}
              iconBg="bg-green-100"
              iconColor="text-green-600"
              title="Dados Principais"
              description="Informações que identificam o seu negócio na plataforma Raiz Conecta."
            >
              {/* Campos travados */}
              <div className="grid md:grid-cols-2 gap-6 bg-gray-50 p-5 rounded-2xl border border-gray-100 mb-6">
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1.5 flex items-center gap-1.5">
                    E-mail de Acesso <Lock size={11} />
                  </label>
                  <div className="w-full bg-gray-100/80 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-400 font-medium cursor-not-allowed select-none">
                    {form.email}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1.5 flex items-center gap-1.5">
                    Documento ({form.tipoDoc || "CNPJ/CPF"}) <Lock size={11} />
                  </label>
                  <div className="w-full bg-gray-100/80 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-400 font-medium cursor-not-allowed select-none">
                    {form.documento || "Não informado"}
                  </div>
                </div>
                <div className="md:col-span-2 text-xs text-gray-400 flex items-center gap-1.5">
                  <ShieldCheck size={13} className="text-green-600" />
                  Dados sensíveis travados por segurança. Contate o suporte para alterar.
                </div>
              </div>
              {/* Campos editáveis */}
              <div className="grid md:grid-cols-2 gap-6">
                <Input
                  label="Nome Fantasia / Razão Social"
                  name="nomeFantasia"
                  type="text"
                  value={form.nomeFantasia || ""}
                  onChange={handleInputChange}
                />
                <Input
                  label="Telefone / WhatsApp"
                  name="telefone"
                  type="text"
                  value={form.telefone || ""}
                  onChange={handleInputChange}
                />
              </div>
            </SectionCard>
          </motion.div>

          {/* CARD 2 — ENDEREÇO */}
          <motion.div {...fadeUp} transition={{ delay: 0.1, duration: 0.35 }}>
            <SectionCard
              icon={MapPin}
              iconBg="bg-blue-100"
              iconColor="text-blue-600"
              title="Endereço de Operação"
              description="Endereço físico utilizado para cálculos de frete e roteirização."
            >
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-5">
                  <Input label="CEP" name="cep" value={form.cep || ""} onChange={handleInputChange} />
                  <Input label="Número" name="numero" value={form.numero || ""} onChange={handleInputChange} />
                </div>
                <Input label="Rua / Estrada / Logradouro" name="rua" value={form.rua || ""} onChange={handleInputChange} />
                <div className="grid grid-cols-2 gap-5">
                  <Input label="Cidade" name="cidade" value={form.cidade || ""} onChange={handleInputChange} />
                  <Input label="Estado (UF)" name="estado" value={form.estado || ""} onChange={handleInputChange} />
                </div>
              </div>
            </SectionCard>
          </motion.div>

          {/* CARD 3 — SENHA */}
          <motion.div {...fadeUp} transition={{ delay: 0.15, duration: 0.35 }}>
            <SectionCard
              icon={Lock}
              iconBg="bg-amber-100"
              iconColor="text-amber-600"
              title="Senha e Segurança"
              description="Preencha abaixo apenas se desejar trocar sua senha de acesso atual."
            >
              <div className="grid md:grid-cols-2 gap-5">
                <Input
                  label="Nova Senha"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={senhaNova}
                  onChange={(e) => setSenhaNova(e.target.value)}
                />
                <Input
                  label="Confirmar Nova Senha"
                  type="password"
                  placeholder="Repita a senha"
                  value={senhaConfirmar}
                  onChange={(e) => setSenhaConfirmar(e.target.value)}
                />
              </div>
            </SectionCard>
          </motion.div>

          {/* BOTÃO SALVAR */}
          <motion.div {...fadeUp} transition={{ delay: 0.2, duration: 0.35 }} className="flex justify-end pt-2 pb-8">
            <Button
              onClick={() => setModalSalvar(true)}
              className="w-full md:w-auto h-14 px-12 text-lg font-bold shadow-xl shadow-green-200 bg-green-600 hover:bg-green-700 hover:-translate-y-1 transition-all"
            >
              <Save size={20} className="mr-2" /> Salvar Alterações
            </Button>
          </motion.div>

          {/* CARD 4 — ZONA DE PERIGO */}
          <motion.div {...fadeUp} transition={{ delay: 0.25, duration: 0.35 }}>
            <div className="bg-red-50 border border-red-100 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex gap-5 items-start">
                <div className="bg-red-100 text-red-600 p-3.5 rounded-2xl shrink-0">
                  <AlertTriangle size={28} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-red-700">Zona de Perigo</h2>
                  <p className="text-red-600/80 text-sm mt-1 leading-relaxed font-medium">
                    A exclusão da conta é irreversível. Todos os seus dados serão apagados permanentemente.
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setModalExcluir(true)}
                variant="outline"
                className="w-full md:w-auto shrink-0 h-12 text-red-600 border-red-300 hover:bg-red-600 hover:text-white font-bold transition-colors"
              >
                <Trash2 size={18} className="mr-2" /> Excluir Conta
              </Button>
            </div>
          </motion.div>

        </div>
      </div>
    </>
  );
}
