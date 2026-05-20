/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner"; // Notificações elegantes
import {
  User,
  MapPin,
  Lock,
  Save,
  Loader2,
  ArrowLeft,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";

export default function MeuPerfil() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [form, setForm] = useState<any>({});
  const [senhaNova, setSenhaNova] = useState("");
  const [senhaConfirmar, setSenhaConfirmar] = useState("");

  useEffect(() => {
    async function carregarDados() {
      const email = localStorage.getItem("userEmail");
      if (!email) return router.push("/login");

      try {
        const res = await fetch(`/api/perfil/meus-dados?email=${email}`);
        if (res.ok) {
          const dados = await res.json();
          setForm(dados);
        } else {
          router.push("/login");
        }
      } catch (error) {
        toast.error("Erro ao carregar os dados do perfil.");
      } finally {
        setLoading(false);
      }
    }
    carregarDados();
  }, [router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const salvarAlteracoes = async () => {
    if (senhaNova || senhaConfirmar) {
      if (senhaNova !== senhaConfirmar)
        return toast.warning("As senhas não coincidem!");
      if (senhaNova.length < 6)
        return toast.warning("A nova senha deve ter pelo menos 6 caracteres.");
    }

    setSalvando(true);
    try {
      const payload = {
        ...form,
        novaSenha: senhaNova !== "" ? senhaNova : undefined,
      };

      const res = await fetch("/api/perfil/meus-dados", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("Perfil atualizado com sucesso!");
        setSenhaNova("");
        setSenhaConfirmar("");
        if (form.nomeFantasia)
          localStorage.setItem("userName", form.nomeFantasia);
        window.dispatchEvent(new Event("storage"));
      } else {
        toast.error("Erro ao atualizar os dados.");
      }
    } catch (error) {
      toast.error("Erro de conexão com o servidor.");
    } finally {
      setSalvando(false);
    }
  };

  const excluirConta = async () => {
    const confirmacao = confirm(
      "⚠️ ATENÇÃO: Esta ação é IRREVERSÍVEL. Tem certeza que deseja excluir sua conta permanentemente?",
    );
    if (!confirmacao) return;

    setSalvando(true);
    try {
      const res = await fetch(`/api/perfil/meus-dados?email=${form.email}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Conta excluída. Sentiremos sua falta!");
        localStorage.clear();
        router.push("/login");
      } else {
        toast.error("Não foi possível excluir a conta.", {
          description: "Pode haver histórico de pedidos vinculados a ela."
        });
      }
    } catch (error) {
      toast.error("Erro de conexão.");
    } finally {
      setSalvando(false);
    }
  };

  if (loading) {
    return (
      <div className="p-20 text-center font-bold text-green-700 flex flex-col justify-center items-center min-h-[60vh]">
        <Loader2 className="animate-spin mb-4" size={40} /> Carregando perfil...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* CABEÇALHO */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <Button
              onClick={() => router.back()}
              variant="ghost"
              className="flex items-center text-gray-500 hover:text-green-700 font-bold mb-3 px-0 h-auto"
            >
              <ArrowLeft className="mr-2" size={18} /> Voltar
            </Button>
            <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
              <User className="text-green-600 bg-green-50 p-2 rounded-xl" size={40} />
              Meu Perfil
            </h1>
            <p className="text-gray-500 mt-2 ml-1">
              Gerencie suas informações pessoais, endereço e segurança.
            </p>
          </div>
          <div className="bg-gray-100 border border-gray-200 text-gray-700 px-5 py-2.5 rounded-xl font-black uppercase text-xs tracking-wider shadow-sm flex items-center gap-2">
            TIPO DE CONTA:
            <Badge variant={form.tipoUser === "produtor" ? "success" : "neutral"}>
              {form.tipoUser === "produtor" ? "Produtor Rural" : "Mercado"}
            </Badge>
          </div>
        </div>

        {/* ÁREA DE EDIÇÃO PRINCIPAL */}
        <div className="grid md:grid-cols-2 gap-6 items-start">

          {/* BLOCO 1: DADOS GERAIS */}
          <Card className="p-6 md:p-8 bg-white shadow-sm border border-gray-100 space-y-5">
            <h2 className="text-xl font-bold text-gray-800 border-b border-gray-100 pb-4 flex items-center gap-2">
              <User size={22} className="text-green-600" /> Dados Principais
            </h2>

            <div className="space-y-4">
              <div>
                <Input label="E-mail (Login)" type="email" value={form.email} disabled className="bg-gray-50 text-gray-500 cursor-not-allowed" />
                <span className="text-[10px] text-gray-400 mt-1 ml-1 font-bold">O e-mail não pode ser alterado.</span>
              </div>
              <Input label="Nome Fantasia / Razão Social" name="nomeFantasia" type="text" value={form.nomeFantasia || ""} onChange={handleInputChange} />
              <Input label="Telefone / WhatsApp" name="telefone" type="text" value={form.telefone || ""} onChange={handleInputChange} />
              <Input label={`Documento (${form.tipoDoc})`} type="text" value={form.documento || ""} disabled className="bg-gray-50 text-gray-500 cursor-not-allowed" />
            </div>
          </Card>

          {/* BLOCO 2: LOCALIZAÇÃO */}
          <Card className="p-6 md:p-8 bg-white shadow-sm border border-gray-100 space-y-5">
            <h2 className="text-xl font-bold text-gray-800 border-b border-gray-100 pb-4 flex items-center gap-2">
              <MapPin size={22} className="text-blue-500" /> Endereço de Operação
            </h2>

            <div className="space-y-4">
              <div className="flex gap-4">
                <Input label="CEP" name="cep" value={form.cep || ""} onChange={handleInputChange} className="w-1/2" />
                <Input label="Número" name="numero" value={form.numero || ""} onChange={handleInputChange} className="w-1/2" />
              </div>
              <Input label="Rua / Estrada" name="rua" value={form.rua || ""} onChange={handleInputChange} />
              <div className="flex gap-4">
                <Input label="Cidade" name="cidade" value={form.cidade || ""} onChange={handleInputChange} className="w-1/2" />
                <Input label="Estado (UF)" name="estado" value={form.estado || ""} onChange={handleInputChange} className="w-1/2" />
              </div>
            </div>
          </Card>
        </div>

        {/* BLOCO 3: SEGURANÇA */}
        <Card className="p-6 md:p-8 bg-white shadow-sm border border-gray-100">
          <div className="mb-6 border-b border-gray-100 pb-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-1">
              <Lock size={22} className="text-amber-500" /> Segurança da Conta
            </h2>
            <p className="text-sm text-gray-500">
              Preencha apenas se desejar alterar sua senha de acesso atual.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Input label="Nova Senha" type="password" placeholder="Mínimo 6 caracteres" value={senhaNova} onChange={(e) => setSenhaNova(e.target.value)} />
            <Input label="Confirmar Nova Senha" type="password" placeholder="Repita a nova senha" value={senhaConfirmar} onChange={(e) => setSenhaConfirmar(e.target.value)} />
          </div>
        </Card>

        {/* BOTÃO SALVAR GERAL */}
        <div className="flex justify-end pt-4">
          <Button
            onClick={salvarAlteracoes}
            isLoading={salvando}
            className="w-full md:w-auto h-16 px-12 text-lg font-bold shadow-xl shadow-green-200 transition-all"
          >
            {!salvando && <Save size={24} className="mr-2" />} Salvar Todas as Alterações
          </Button>
        </div>

        <hr className="border-gray-200 my-10" />

        {/* BLOCO 4: ZONA DE PERIGO */}
        <Card className="p-6 md:p-8 bg-red-50 border border-red-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-xl font-bold text-red-700 flex items-center gap-2 mb-2">
              <AlertTriangle size={24} className="text-red-600" /> Zona de Perigo
            </h2>
            <p className="text-sm text-red-600 font-medium">
              A exclusão da conta removerá permanentemente todos os seus dados
              pessoais do sistema Raiz Conecta.
            </p>
          </div>
          <Button
            onClick={excluirConta}
            variant="outline"
            className="w-full md:w-auto h-14 text-red-600 border-red-300 hover:bg-red-600 hover:text-white transition-colors font-bold px-8"
          >
            <Trash2 size={20} className="mr-2" /> Excluir Minha Conta
          </Button>
        </Card>
      </div>
    </div>
  );
}