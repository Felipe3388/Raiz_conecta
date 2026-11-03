"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Mail, Phone, User } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { readSignupDraft, saveSignupDraft } from "@/lib/auth/signupDraft";
import { isValidEmail, maskPhone, validateSignup } from "@/lib/validation/auth";
import { AuthError } from "./AuthError";
import { PasswordField } from "./PasswordField";

const ACCOUNT_TYPES = [
  { value: "produtor", label: "Produtor Rural", icon: "🌱" },
  { value: "mercado", label: "Mercado / Supermercado", icon: "🏪" },
] as const;

interface SignupFormProps {
  onOpenTerms: () => void;
  onOpenPrivacy: () => void;
}

// Passo 1 do cadastro: dados da conta. O passo 2 (documento e endereço) é em /completar-perfil, que lê estes dados da
// memória da página (lib/auth/signupDraft): a senha não vai para nenhum storage do navegador.
export function SignupForm({ onOpenTerms, onOpenPrivacy }: SignupFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [accepted, setAccepted] = useState(false);
  // Quem volta do passo 2 encontra o que já tinha digitado.
  const [form, setForm] = useState(() => readSignupDraft() ?? {
    tipoUsuario: "produtor",
    nome: "",
    email: "",
    telefone: "",
    senha: "",
    confirmarSenha: "",
  });

  const set = (field: keyof typeof form) => (value: string) => setForm((current) => ({ ...current, [field]: value }));

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    const problem = validateSignup(form) ?? (accepted ? null : "Aceite os Termos de Uso e a Política de Privacidade.");
    if (problem) return setError(problem);

    saveSignupDraft({ ...form, nome: form.nome.trim(), email: form.email.trim() });
    router.push("/completar-perfil");
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-gray-950 text-center">Junte-se a nós</h1>

      <form onSubmit={submit} className="space-y-5" noValidate>
        {error && <AuthError message={error} />}

        <fieldset className="space-y-1.5">
          <legend className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-1.5">
            <Building2 size={16} /> Tipo de Perfil
          </legend>
          <div className="grid grid-cols-2 gap-3">
            {ACCOUNT_TYPES.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={form.tipoUsuario === option.value}
                onClick={() => set("tipoUsuario")(option.value)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 font-bold text-sm transition-all ${
                  form.tipoUsuario === option.value
                    ? "border-green-500 bg-green-50 text-green-800"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                }`}
              >
                <span className="text-xl" aria-hidden="true">{option.icon}</span>
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <Input
          label="Nome Fantasia / Razão Social"
          name="nome"
          icon={User}
          placeholder="Fazenda São João"
          autoComplete="organization"
          value={form.nome}
          onChange={(event) => set("nome")(event.target.value)}
        />
        <Input
          label="E-mail"
          name="email"
          type="email"
          icon={Mail}
          placeholder="seu@email.com"
          autoComplete="email"
          value={form.email}
          onChange={(event) => set("email")(event.target.value)}
          error={form.email && !isValidEmail(form.email) ? "E-mail inválido" : undefined}
        />
        <Input
          label="Telefone / WhatsApp"
          name="telefone"
          type="tel"
          icon={Phone}
          placeholder="(14) 99999-9999"
          autoComplete="tel"
          value={form.telefone}
          onChange={(event) => set("telefone")(maskPhone(event.target.value))}
        />

        <PasswordField label="Senha" value={form.senha} onChange={set("senha")} placeholder="Crie uma senha forte" autoComplete="new-password" showStrength />
        <PasswordField label="Confirmar Senha" value={form.confirmarSenha} onChange={set("confirmarSenha")} placeholder="Repita a senha" autoComplete="new-password" matchWith={form.senha} />

        <label className="flex items-start gap-2.5 text-xs text-gray-600 pt-1 cursor-pointer">
          <input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} className="mt-0.5 accent-green-600 rounded" />
          <span>
            Li e concordo com os{" "}
            <button type="button" onClick={onOpenTerms} className="text-green-700 font-bold hover:underline">Termos de Uso</button>{" "}
            e{" "}
            <button type="button" onClick={onOpenPrivacy} className="text-green-700 font-bold hover:underline">Política de Privacidade</button>.
          </span>
        </label>

        <Button type="submit" className="w-full h-12 text-base">
          Avançar para o Passo 2
        </Button>
      </form>
    </div>
  );
}
