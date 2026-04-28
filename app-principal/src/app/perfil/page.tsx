/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
        console.error("Erro:", error);
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
        return alert("As senhas não coincidem!");
      if (senhaNova.length < 6)
        return alert("A nova senha deve ter pelo menos 6 caracteres.");
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
        alert("✅ Perfil atualizado com sucesso!");
        setSenhaNova("");
        setSenhaConfirmar("");
        if (form.nomeFantasia)
          localStorage.setItem("userName", form.nomeFantasia);
        window.dispatchEvent(new Event("storage"));
      } else {
        alert("Erro ao atualizar os dados.");
      }
    } catch (error) {
      alert("Erro de conexão.");
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
        alert("Conta excluída com sucesso. Sentiremos sua falta!");
        localStorage.clear();
        router.push("/login");
      } else {
        alert(
          "Não foi possível excluir a conta. Pode haver histórico de pedidos vinculados a ela.",
        );
      }
    } catch (error) {
      alert("Erro de conexão.");
    } finally {
      setSalvando(false);
    }
  };

  if (loading) {
    return (
      <div className="p-20 text-center font-bold text-green-700 flex justify-center items-center min-h-[60vh]">
        <Loader2 className="animate-spin mr-2" size={32} /> Carregando perfil...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* CABEÇALHO */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <button
              onClick={() => router.back()}
              className="flex items-center text-gray-500 hover:text-green-700 font-bold mb-3 transition-colors"
            >
              <ArrowLeft className="mr-2" size={18} /> Voltar
            </button>
            <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
              <User
                className="text-green-600 bg-green-50 p-2 rounded-xl"
                size={40}
              />{" "}
              Meu Perfil
            </h1>
            <p className="text-gray-500 mt-2 ml-1">
              Gerencie suas informações pessoais, endereço e segurança.
            </p>
          </div>
          <span className="bg-gray-100 border border-gray-200 text-gray-700 px-5 py-2.5 rounded-xl font-black uppercase text-xs tracking-wider shadow-sm">
            TIPO DE CONTA:{" "}
            <span
              className={
                form.tipoUser === "produtor"
                  ? "text-green-700"
                  : "text-blue-700"
              }
            >
              {form.tipoUser === "produtor" ? "Produtor Rural" : "Mercado"}
            </span>
          </span>
        </div>

        {/* ÁREA DE EDIÇÃO PRINCIPAL */}
        <div className="grid md:grid-cols-2 gap-6 items-start">
          {/* BLOCO 1: DADOS GERAIS */}
          <Card className="p-6 md:p-8 bg-white shadow-sm border border-gray-100 space-y-5">
            <h2 className="text-xl font-bold text-gray-800 border-b border-gray-100 pb-4 flex items-center gap-2">
              <User size={22} className="text-green-600" /> Dados Principais
            </h2>

            <div>
              <label className="text-sm font-bold text-gray-600 mb-1.5 block">
                E-mail (Login)
              </label>
              <input
                type="email"
                value={form.email}
                disabled
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 outline-none cursor-not-allowed font-medium"
              />
              <span className="text-xs text-gray-400 mt-1 block">
                O e-mail não pode ser alterado.
              </span>
            </div>

            <div>
              <label className="text-sm font-bold text-gray-600 mb-1.5 block">
                Nome Fantasia / Razão Social
              </label>
              <input
                type="text"
                name="nomeFantasia"
                value={form.nomeFantasia || ""}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none font-medium text-gray-800"
              />
            </div>

            <div>
              <label className="text-sm font-bold text-gray-600 mb-1.5 block">
                Telefone / WhatsApp
              </label>
              <input
                type="text"
                name="telefone"
                value={form.telefone || ""}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none font-medium text-gray-800"
              />
            </div>

            <div>
              <label className="text-sm font-bold text-gray-600 mb-1.5 block">
                Documento ({form.tipoDoc})
              </label>
              <input
                type="text"
                value={form.documento || ""}
                disabled
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 outline-none cursor-not-allowed font-medium"
              />
            </div>
          </Card>

          {/* BLOCO 2: LOCALIZAÇÃO */}
          <Card className="p-6 md:p-8 bg-white shadow-sm border border-gray-100 space-y-5">
            <h2 className="text-xl font-bold text-gray-800 border-b border-gray-100 pb-4 flex items-center gap-2">
              <MapPin size={22} className="text-blue-500" /> Endereço de
              Operação
            </h2>

            <div className="flex gap-4">
              <div className="w-1/2">
                <label className="text-sm font-bold text-gray-600 mb-1.5 block">
                  CEP
                </label>
                <input
                  type="text"
                  name="cep"
                  value={form.cep || ""}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none font-medium text-gray-800"
                />
              </div>
              <div className="w-1/2">
                <label className="text-sm font-bold text-gray-600 mb-1.5 block">
                  Número
                </label>
                <input
                  type="text"
                  name="numero"
                  value={form.numero || ""}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none font-medium text-gray-800"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-bold text-gray-600 mb-1.5 block">
                Rua / Estrada
              </label>
              <input
                type="text"
                name="rua"
                value={form.rua || ""}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none font-medium text-gray-800"
              />
            </div>

            <div className="flex gap-4">
              <div className="w-1/2">
                <label className="text-sm font-bold text-gray-600 mb-1.5 block">
                  Cidade
                </label>
                <input
                  type="text"
                  name="cidade"
                  value={form.cidade || ""}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none font-medium text-gray-800"
                />
              </div>
              <div className="w-1/2">
                <label className="text-sm font-bold text-gray-600 mb-1.5 block">
                  Estado
                </label>
                <input
                  type="text"
                  name="estado"
                  value={form.estado || ""}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none font-medium text-gray-800"
                />
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
            <div>
              <label className="text-sm font-bold text-gray-600 mb-1.5 block">
                Nova Senha
              </label>
              <input
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={senhaNova}
                onChange={(e) => setSenhaNova(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 outline-none font-medium text-gray-800"
              />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-600 mb-1.5 block">
                Confirmar Nova Senha
              </label>
              <input
                type="password"
                placeholder="Repita a nova senha"
                value={senhaConfirmar}
                onChange={(e) => setSenhaConfirmar(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 outline-none font-medium text-gray-800"
              />
            </div>
          </div>
        </Card>

        {/* BOTÃO SALVAR GERAL */}
        <div className="flex justify-end pt-4">
          <Button
            onClick={salvarAlteracoes}
            disabled={salvando}
            className="w-full md:w-auto h-16 px-12 text-lg font-bold bg-green-600 hover:bg-green-700 shadow-xl shadow-green-200 transition-all flex items-center gap-2"
          >
            {salvando ? (
              <Loader2 className="animate-spin" />
            ) : (
              <>
                <Save size={24} /> Salvar Todas as Alterações
              </>
            )}
          </Button>
        </div>

        <hr className="border-gray-200 my-10" />

        {/* BLOCO 4: ZONA DE PERIGO */}
        <Card className="p-6 md:p-8 bg-red-50 border border-red-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-xl font-bold text-red-700 flex items-center gap-2 mb-2">
              <AlertTriangle size={24} className="text-red-600" /> Zona de
              Perigo
            </h2>
            <p className="text-sm text-red-600 font-medium">
              A exclusão da conta removerá permanentemente todos os seus dados
              pessoais do sistema Raiz Conecta.
            </p>
          </div>
          <Button
            onClick={excluirConta}
            variant="outline"
            className="w-full md:w-auto h-14 text-red-600 border-red-300 hover:bg-red-600 hover:text-white transition-colors font-bold flex items-center gap-2 px-8"
          >
            <Trash2 size={20} /> Excluir Minha Conta
          </Button>
        </Card>
      </div>
    </div>
  );
}
