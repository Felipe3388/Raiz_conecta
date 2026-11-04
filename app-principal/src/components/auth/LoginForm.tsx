"use client";

import { Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useLoginForm } from "@/hooks/useLoginForm";
import { AuthError } from "./AuthError";
import { PasswordField } from "./PasswordField";

export function LoginForm({ onPending }: { onPending: () => void }) {
  const { email, setEmail, senha, setSenha, error, submitting, submit } = useLoginForm({ onPending });

  return (
    <div className="space-y-6">
      <h1 className="!text-[1.75rem] !font-extrabold">Entrar na conta</h1>

      <form onSubmit={submit} className="space-y-5" noValidate>
        {error && <AuthError message={error} />}

        <Input
          label="E-mail"
          name="email"
          type="email"
          icon={Mail}
          placeholder="seu@email.com"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={submitting}
        />

        <PasswordField
          label="Senha"
          value={senha}
          onChange={setSenha}
          placeholder="Sua senha"
          autoComplete="current-password"
          disabled={submitting}
        />

        <div className="text-right">
          <button
            type="button"
            onClick={() => toast.info("A recuperação de senha estará disponível em breve. Para urgências, contate o suporte.")}
            className="text-xs text-gray-500 hover:text-gray-700 font-medium transition-colors"
          >
            Esqueceu a senha?
          </button>
        </div>

        <Button type="submit" isLoading={submitting} className="w-full h-12 text-base">
          Entrar
        </Button>
      </form>
    </div>
  );
}
