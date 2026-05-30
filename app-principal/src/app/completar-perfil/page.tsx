"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  UploadCloud,
  MapPin,
  FileText,
  Loader2,
  CheckCircle,
  ArrowLeft,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function CompletarPerfilPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [arquivo, setArquivo] = useState<File | null>(null);

  // Os dados do Passo 1 (que vieram da tela de Login)
  const [dadosPasso1, setDadosPasso1] = useState({
    tipoUsuario: "",
    nome: "",
    email: "",
    senha: "",
  });

  const [formDados, setFormDados] = useState({
    tipoDoc: "CPF",
    documento: "",
    tipoComprovante: "RG",
    cep: "",
    rua: "",
    numero: "",
    bairro: "",
    cidade: "",
    estado: "",
  });

  useEffect(() => {
    // Puxa os dados do Passo 1 que foram salvos temporariamente
    const temp = sessionStorage.getItem("cadastro_temporario");
    if (temp) {
      setDadosPasso1(JSON.parse(temp));
    } else {
      // Se tentar acessar direto pela URL sem passar pelo Passo 1, expulsa
      toast.error("Por favor, preencha os dados iniciais primeiro.");
      router.push("/login");
    }
  }, [router]);

  // ==========================================
  // FUNÇÕES DE MÁSCARA E VIA CEP
  // ==========================================
  const handleDocumentoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");

    if (formDados.tipoDoc === "CPF") {
      value = value
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})/, "$1-$2")
        .slice(0, 14);
    } else {
      value = value
        .replace(/^(\d{2})(\d)/, "$1.$2")
        .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/\.(\d{3})(\d)/, ".$1/$2")
        .replace(/(\d{4})(\d)/, "$1-$2")
        .slice(0, 18);
    }
    setFormDados({ ...formDados, documento: value });
  };

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let cep = e.target.value.replace(/\D/g, "");

    const cepMascarado = cep.replace(/^(\d{5})(\d)/, "$1-$2").slice(0, 9);
    setFormDados({ ...formDados, cep: cepMascarado });

    if (cep.length === 8) {
      setBuscandoCep(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setFormDados((prev) => ({
            ...prev,
            rua: data.logradouro,
            bairro: data.bairro,
            cidade: data.localidade,
            estado: data.uf,
          }));
        } else {
          toast.error("CEP não encontrado.");
        }
      } catch (error) {
        toast.error("Erro ao buscar CEP.");
      } finally {
        setBuscandoCep(false);
      }
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormDados({ ...formDados, [e.target.name]: e.target.value });
  };

  // ==========================================
  // ENVIO FINAL PARA A API DE CADASTRO
  // ==========================================
  const enviarDados = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!arquivo)
      return toast.warning(
        "Por favor, anexe a foto do seu documento para validação.",
      );

    setLoading(true);

    const docLimpo = formDados.documento.replace(/\D/g, "");
    const cepLimpo = formDados.cep.replace(/\D/g, "");

    // Monta o pacote final juntando Passo 1 (Variáveis de Estado) e Passo 2
    const formData = new FormData();
    formData.append("email", dadosPasso1.email);
    formData.append("senha", dadosPasso1.senha);
    formData.append("nome", dadosPasso1.nome);
    formData.append("tipoUsuario", dadosPasso1.tipoUsuario);
    formData.append("tipoDoc", formDados.tipoDoc);
    formData.append("documento", docLimpo);
    formData.append("cep", cepLimpo);
    formData.append("rua", formDados.rua);
    formData.append("numero", formDados.numero);
    formData.append("bairro", formDados.bairro);
    formData.append("cidade", formDados.cidade);
    formData.append("estado", formDados.estado);
    formData.append("tipoComprovante", formDados.tipoComprovante);
    formData.append("file", arquivo);

    try {
      // Repare que mandamos direto para a API de Cadastro que você já tinha pronto!
      const res = await fetch("/api/auth/cadastro", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        toast.success("Conta criada com sucesso!", {
          description: "Sua conta já está na fila de análise.",
        });

        // Limpa a memória temporária
        sessionStorage.removeItem("cadastro_temporario");

        // Redireciona o usuário para o login (onde ele verá a tela de "Em Análise" se tentar logar)
        router.push("/login");
      } else {
        const errData = await res.json();
        toast.error(
          errData.error || "Erro ao criar a conta. Verifique os dados.",
        );
      }
    } catch (err) {
      toast.error("Erro de conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-green-50/30 p-6 flex flex-col items-center justify-center pb-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full"
      >
        <div className="mb-6">
          <button
            onClick={() => router.push("/login")}
            className="flex items-center text-gray-500 hover:text-green-700 font-bold transition-colors"
          >
            <ArrowLeft className="mr-2" size={18} /> Voltar para o Passo 1
          </button>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-green-900 mb-2">
            Quase lá, {dadosPasso1.nome.split(" ")[0]}!
          </h1>
          <p className="text-gray-600 font-medium">
            Precisamos apenas dos seus dados logísticos e documento para validar
            sua conta.
          </p>
        </div>

        <Card className="p-2 sm:p-4">
          <form onSubmit={enviarDados} className="space-y-6">
            {/* BLOCO DOCUMENTO */}
            <div className="p-5 bg-white border border-gray-200 rounded-xl shadow-sm">
              <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
                <FileText size={18} className="text-green-600" /> Identificação
                Oficial
              </h3>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="w-full sm:w-1/3">
                  <label className="text-sm font-semibold text-gray-700 block mb-1">
                    Tipo de Doc
                  </label>
                  <select
                    name="tipoDoc"
                    value={formDados.tipoDoc}
                    onChange={(e) => {
                      handleInputChange(e);
                      setFormDados((prev) => ({ ...prev, documento: "" }));
                    }}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none bg-white font-medium"
                  >
                    <option value="CPF">Pessoa Física (CPF)</option>
                    <option value="CNPJ">Empresa (CNPJ)</option>
                  </select>
                </div>
                <div className="w-full sm:w-2/3">
                  <Input
                    label="Número do Documento"
                    name="documento"
                    value={formDados.documento}
                    onChange={handleDocumentoChange}
                    placeholder={
                      formDados.tipoDoc === "CPF"
                        ? "000.000.000-00"
                        : "00.000.000/0001-00"
                    }
                    required
                  />
                </div>
              </div>
            </div>

            {/* BLOCO ENDEREÇO */}
            <div className="p-5 bg-white border border-gray-200 rounded-xl shadow-sm">
              <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
                <MapPin size={18} className="text-blue-500" /> Logística e
                Endereço
              </h3>

              <div className="relative w-full sm:w-1/2 mb-5">
                <Input
                  label="CEP"
                  name="cep"
                  value={formDados.cep}
                  onChange={handleCepChange}
                  placeholder="00000-000"
                  required
                />
                {buscandoCep && (
                  <Loader2
                    className="absolute right-3 top-9 text-green-500 animate-spin"
                    size={18}
                  />
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="w-full sm:w-3/4">
                  <Input
                    label="Rua / Estrada"
                    name="rua"
                    value={formDados.rua}
                    onChange={handleInputChange}
                    placeholder="Nome da Rua"
                    required
                  />
                </div>
                <div className="w-full sm:w-1/4">
                  <Input
                    label="Número"
                    name="numero"
                    value={formDados.numero}
                    onChange={handleInputChange}
                    placeholder="S/N"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="w-full sm:w-1/3">
                  <Input
                    label="Bairro"
                    name="bairro"
                    value={formDados.bairro}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="w-full sm:w-1/3">
                  <Input
                    label="Cidade"
                    name="cidade"
                    value={formDados.cidade}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="w-full sm:w-1/3">
                  <Input
                    label="Estado (UF)"
                    name="estado"
                    value={formDados.estado}
                    onChange={handleInputChange}
                    placeholder="SP"
                    required
                  />
                </div>
              </div>
            </div>

            {/* BLOCO UPLOAD */}
            <div className="p-5 bg-white border border-gray-200 rounded-xl shadow-sm">
              <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
                <UploadCloud size={18} className="text-amber-500" /> Comprovante
                Fotográfico
              </h3>

              <div className="mb-4">
                <label className="text-sm font-semibold text-gray-700 block mb-1">
                  O que você vai anexar?
                </label>
                <select
                  name="tipoComprovante"
                  value={formDados.tipoComprovante}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 outline-none bg-white font-medium"
                >
                  <option value="RG">Carteira de Identidade (RG)</option>
                  <option value="CNH">Carteira de Motorista (CNH)</option>
                  <option value="CONTRATO_SOCIAL">
                    Contrato Social (Empresas)
                  </option>
                  <option value="CARTAO_CNPJ">Cartão CNPJ</option>
                </select>
              </div>

              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${arquivo ? "border-green-500 bg-green-50 shadow-inner" : "border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400"}`}
              >
                <input
                  type="file"
                  className="hidden"
                  id="fileDoc"
                  accept="image/*,.pdf"
                  onChange={(e) => setArquivo(e.target.files?.[0] || null)}
                />
                <label
                  htmlFor="fileDoc"
                  className="cursor-pointer block w-full h-full"
                >
                  {arquivo ? (
                    <div className="flex flex-col items-center text-green-700">
                      <CheckCircle className="w-12 h-12 mb-2" />
                      <span className="font-bold text-lg">{arquivo.name}</span>
                      <span className="text-sm opacity-80">
                        Clique para trocar a foto
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-gray-500">
                      <UploadCloud className="w-12 h-12 mb-2 text-gray-400" />
                      <span className="font-bold text-gray-700 mb-1 text-lg">
                        Clique aqui para anexar seu {formDados.tipoComprovante}
                      </span>
                      <span className="text-sm font-medium">
                        Tire uma foto bem nítida. Máx 5 MB.
                      </span>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-16 text-xl font-bold shadow-xl hover:shadow-green-200"
              isLoading={loading}
            >
              Concluir Cadastro
            </Button>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
