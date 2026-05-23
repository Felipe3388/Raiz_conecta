"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner"; // Importando as notificações
import { UploadCloud, MapPin, FileText, Loader2, CheckCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function CompletarPerfilPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [buscandoCep, setBuscandoCep] = useState(false);
    const [arquivo, setArquivo] = useState<File | null>(null);

    const [formDados, setFormDados] = useState({
        tipoDoc: "CPF",
        documento: "",
        tipoComprovante: "RG",
        cep: "",
        rua: "",
        numero: "",
        bairro: "",
        cidade: "",
        estado: ""
    });

    const [usuarioLocal, setUsuarioLocal] = useState({ email: "", role: "" });

    useEffect(() => {
        const email = localStorage.getItem("userEmail") || "";
        const role = localStorage.getItem("userRole") || "";
        setUsuarioLocal({ email, role });

        if (!email) router.push("/login");
    }, [router]);

    // FUNÇÕES DE MÁSCARA
    const handleDocumentoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, "");

        if (formDados.tipoDoc === "CPF") {
            value = value.replace(/(\d{3})(\d)/, "$1.$2")
                .replace(/(\d{3})(\d)/, "$1.$2")
                .replace(/(\d{3})(\d{1,2})/, "$1-$2")
                .slice(0, 14);
        } else {
            value = value.replace(/^(\d{2})(\d)/, "$1.$2")
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
                    setFormDados(prev => ({
                        ...prev,
                        rua: data.logradouro,
                        bairro: data.bairro,
                        cidade: data.localidade,
                        estado: data.uf
                    }));
                } else {
                    toast.error("CEP não encontrado."); // Substituiu o alert
                }
            } catch (error) {
                toast.error("Erro ao buscar CEP.");
            } finally {
                setBuscandoCep(false);
            }
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormDados({ ...formDados, [e.target.name]: e.target.value });
    };

    // ENVIO LIMPO PARA O BANCO
    const enviarDados = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!arquivo) return toast.warning("Por favor, anexe a foto do seu documento.");

  setLoading(true);

  const docLimpo = formDados.documento.replace(/\D/g, "");
  const cepLimpo = formDados.cep.replace(/\D/g, "");

  const formData = new FormData();

  // Passo 1 — vindos do localStorage
  formData.append("nome", localStorage.getItem("userName") || "");
  formData.append("email", usuarioLocal.email);
  formData.append("senha", localStorage.getItem("userPass") || "");
  formData.append("tipoUsuario", usuarioLocal.role);

  // Passo 2 — formulário atual
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
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/perfil/completar`, { method: "POST", body: formData });
    if (res.ok) {
      // Limpa o localStorage após cadastro concluído
      localStorage.removeItem("userPass");

      toast.success("Perfil completo!", {
        description: "Aguardando liberação do sistema."
      });

      if (usuarioLocal.role === "produtor") router.push("/produtor");
      else router.push("/catalogo");
    } else {
      const err = await res.json();
      toast.error(err.error || "Erro ao salvar os dados.");
    }
  } catch (err) {
    toast.error("Erro de conexão com o servidor.");
  } finally {
    setLoading(false);
  }
    };

    return (
        <div className="min-h-screen bg-green-50/50 p-6 flex flex-col items-center justify-center pb-20">
            <div className="max-w-2xl w-full">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-green-900 mb-2">Quase lá!</h1>
                    <p className="text-gray-600">Precisamos apenas dos seus dados logísticos e documento para validar sua conta.</p>
                </div>

                <Card>
                    <form onSubmit={enviarDados} className="space-y-6">

                        {/* BLOCO DOCUMENTO */}
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <h3 className="font-bold text-gray-700 flex items-center gap-2 mb-4"><FileText size={18} /> Identificação</h3>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="w-full sm:w-1/3">
                                    <label className="text-sm font-semibold text-gray-700 block mb-1">Tipo</label>
                                    <select name="tipoDoc" value={formDados.tipoDoc} onChange={(e) => {
                                        handleInputChange(e);
                                        setFormDados(prev => ({ ...prev, documento: "" })); // Limpa ao trocar
                                    }} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none bg-white">
                                        <option value="CPF">CPF</option>
                                        <option value="CNPJ">CNPJ</option>
                                    </select>
                                </div>
                                <div className="w-full sm:w-2/3">
                                    <Input
                                        label="Número do Documento"
                                        name="documento"
                                        value={formDados.documento}
                                        onChange={handleDocumentoChange}
                                        placeholder={formDados.tipoDoc === "CPF" ? "000.000.000-00" : "00.000.000/0001-00"}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* BLOCO ENDEREÇO COM VIA CEP */}
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <h3 className="font-bold text-gray-700 flex items-center gap-2 mb-4"><MapPin size={18} /> Logística de Coleta/Entrega</h3>

                            <div className="relative w-full sm:w-1/2 mb-4">
                                <Input label="CEP" name="cep" value={formDados.cep} onChange={handleCepChange} placeholder="00000-000" />
                                {buscandoCep && <Loader2 className="absolute right-3 top-9 text-green-500 animate-spin" size={18} />}
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 mb-4">
                                <div className="w-full sm:w-3/4">
                                    <Input label="Rua / Estrada" name="rua" value={formDados.rua} onChange={handleInputChange} placeholder="Ex: Estrada Rural Km 12" />
                                </div>
                                <div className="w-full sm:w-1/4">
                                    <Input label="Número" name="numero" value={formDados.numero} onChange={handleInputChange} placeholder="S/N" />
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="w-full sm:w-1/3"><Input label="Bairro" name="bairro" value={formDados.bairro} onChange={handleInputChange} /></div>
                                <div className="w-full sm:w-1/3"><Input label="Cidade" name="cidade" value={formDados.cidade} onChange={handleInputChange} /></div>
                                <div className="w-full sm:w-1/3"><Input label="Estado (UF)" name="estado" value={formDados.estado} onChange={handleInputChange} placeholder="SP" /></div>
                            </div>
                        </div>

                        {/* BLOCO FOTO ESPECÍFICO */}
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <h3 className="font-bold text-gray-700 flex items-center gap-2 mb-4"><UploadCloud size={18} /> Foto do Documento</h3>

                            <div className="mb-4">
                                <label className="text-sm font-semibold text-gray-700 block mb-1">Selecione um Documento a ser anexado:</label>
                                <select name="tipoComprovante" value={formDados.tipoComprovante} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none bg-white">
                                    <option value="RG">Carteira de Identidade (RG)</option>
                                    <option value="CNH">Carteira de Motorista (CNH)</option>
                                    <option value="CONTRATO_SOCIAL">Contrato Social (Empresas)</option>
                                    <option value="CARTAO_CNPJ">Cartão CNPJ</option>
                                </select>
                            </div>

                            <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${arquivo ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-white hover:bg-gray-50'}`}>
                                <input type="file" className="hidden" id="fileDoc" accept="image/*,.pdf" onChange={(e) => setArquivo(e.target.files?.[0] || null)} />
                                <label htmlFor="fileDoc" className="cursor-pointer block">
                                    {arquivo ? (
                                        <div className="flex flex-col items-center text-green-700">
                                            <CheckCircle className="w-12 h-12 mb-2" />
                                            <span className="font-bold">{arquivo.name}</span>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center text-gray-500">
                                            <UploadCloud className="w-12 h-12 mb-2 text-gray-400" />
                                            <span className="font-semibold text-gray-700 mb-1">Clique aqui para anexar seu {formDados.tipoComprovante}</span>
                                            <span className="text-xs">Foto legível. Máx 5 MB</span>
                                        </div>
                                    )}
                                </label>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-14 text-lg font-bold"
                            isLoading={loading}
                        >
                            Finalizar Cadastro e Entrar
                        </Button>
                    </form>
                </Card>
            </div>
        </div>
    );
}