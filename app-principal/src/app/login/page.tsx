"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Leaf } from "lucide-react";
import { useFormik } from "formik";
import { toast } from "sonner"; // Notificações elegantes
import { loginSchema, cadastroSchema } from "@/schemas/authSchema";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

export default function LoginPage() {
    const router = useRouter();
    const [isLogin, setIsLogin] = useState(true);
    const [tipoUsuario, setTipoUsuario] = useState<"produtor" | "mercado">("produtor");

    const formik = useFormik({
        initialValues: {
            tipoUsuario: "produtor",
            nome: "",
            email: "",
            senha: "",
        },
        validationSchema: isLogin ? loginSchema : cadastroSchema,
        onSubmit: async (values, { setSubmitting, setFieldError }) => {
            if (isLogin) {
                // ==========================================
                // LÓGICA DE LOGIN
                // ==========================================
                try {
                    const resposta = await fetch('/api/auth/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: values.email, senha: values.senha }),
                    });

                    const dados = await resposta.json();

                    if (!resposta.ok) {
                        setFieldError("senha", dados.error || "Erro ao fazer login");
                        toast.error(dados.error || "Acesso negado. Verifique suas credenciais.");
                        return;
                    }

                    localStorage.setItem("userEmail", values.email);
                    const nomeProvisorio = values.email.split('@')[0];
                    localStorage.setItem("userName", nomeProvisorio);
                    localStorage.setItem("userRole", dados.tipoUser);

                    toast.success("Login efetuado com sucesso!", {
                        description: "Redirecionando para o seu painel..."
                    });

                    if (dados.tipoUser === "produtor") router.push("/produtor");
                    else if (dados.tipoUser === "mercado") router.push("/catalogo");
                    else if (dados.tipoUser === "admin") router.push("/admin");
                    else router.push("/");

                } catch (erro) {
                    console.error("Erro no login:", erro);
                    toast.error("Erro de conexão com o servidor.", {
                        description: "Tente novamente mais tarde."
                    });
                } finally {
                    setSubmitting(false);
                }
            } else {
                // ==========================================
                // LÓGICA DE CADASTRO (Single Save)
                // ==========================================
                localStorage.setItem("userEmail", values.email);
                localStorage.setItem("userRole", values.tipoUsuario);
                localStorage.setItem("userPass", values.senha);
                const nomeParaSalvar = values.nome ? values.nome : values.email.split('@')[0];
                localStorage.setItem("userName", nomeParaSalvar);

                setSubmitting(false);
                toast.info("Passo 1 concluído!", {
                    description: "Vamos finalizar o seu perfil agora."
                });
                router.push("/completar-perfil");
            }
        },
    });

    const alternarAba = (modoLogin: boolean) => {
        setIsLogin(modoLogin);
        formik.resetForm();
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-green-50/50">
            <div className="w-full max-w-md animate-in fade-in zoom-in duration-300">
                <div className="flex justify-center mb-8">
                    <Link href="/" className="flex items-center gap-2 text-green-700 font-bold text-3xl hover:scale-105 transition-transform">
                        <Leaf className="h-8 w-8" />
                        Raiz Conecta
                    </Link>
                </div>

                <Card>
                    <div className="flex border-b mb-6">
                        <button onClick={() => alternarAba(true)} type="button" className={`flex-1 py-3 text-center font-medium transition-colors ${isLogin ? "border-b-2 border-green-600 text-green-700 bg-green-50/50" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}>
                            Entrar
                        </button>
                        <button onClick={() => alternarAba(false)} type="button" className={`flex-1 py-3 text-center font-medium transition-colors ${!isLogin ? "border-b-2 border-green-600 text-green-700 bg-green-50/50" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}>
                            Criar Conta
                        </button>
                    </div>

                    <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                        {isLogin ? "Bem-vindo de volta!" : "Junte-se a nós"}
                    </h2>

                    <form className="space-y-4" onSubmit={formik.handleSubmit}>
                        {!isLogin && (
                            <div className="space-y-4 animate-in slide-in-from-left-4 fade-in">
                                <div className="flex flex-col gap-1 w-full">
                                    <label className="text-sm font-semibold text-gray-700">Tipo de Perfil</label>
                                    <select name="tipoUsuario" value={formik.values.tipoUsuario} onChange={(e) => { setTipoUsuario(e.target.value as "produtor" | "mercado"); formik.handleChange(e); }} className="px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 outline-none focus:ring-2 focus:ring-green-500/50">
                                        <option value="produtor">Sou Produtor Rural</option>
                                        <option value="mercado">Sou um Mercado / Comprador</option>
                                    </select>
                                </div>
                                <Input label={tipoUsuario === "produtor" ? "Nome Completo" : "Razão Social"} name="nome" type="text" placeholder={tipoUsuario === "produtor" ? "João da Silva" : "Mercado Central Ltda"} value={formik.values.nome} onChange={formik.handleChange} onBlur={formik.handleBlur} error={formik.touched.nome ? formik.errors.nome as string : undefined} />
                            </div>
                        )}
                        <Input label="E-mail" name="email" type="email" placeholder="seu@email.com" value={formik.values.email} onChange={formik.handleChange} onBlur={formik.handleBlur} error={formik.touched.email ? formik.errors.email as string : undefined} />
                        <Input label="Senha" name="senha" type="password" placeholder="••••••••" value={formik.values.senha} onChange={formik.handleChange} onBlur={formik.handleBlur} error={formik.touched.senha ? formik.errors.senha as string : undefined} />

                        <Button
                            className="mt-6 w-full h-12 text-lg"
                            type="submit"
                            isLoading={formik.isSubmitting} // <-- A mágica do botão acontece aqui
                        >
                            {isLogin ? "Entrar na Plataforma" : "Avançar para o Passo 2"}
                        </Button>
                    </form>
                </Card>
            </div>
        </div>
    );
}