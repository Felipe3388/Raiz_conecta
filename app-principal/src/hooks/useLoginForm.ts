"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { homeFor } from "@/lib/auth/client";
import { api } from "@/lib/http/client";
import { validateLogin } from "@/lib/validation/auth";

interface Options {
  // A conta ainda está em análise: o login responde, mas não deixa entrar.
  onPending: () => void;
}

interface LoginResponse {
  user: { email: string; tipoUser: string; nome: string; status: string };
}

// O formulário de login: valida, chama /api/auth/login (o servidor grava o cookie da sessão) e leva cada perfil
// para a sua área. O token não passa pelo JavaScript da página.
export function useLoginForm({ onPending }: Options) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;
    setError("");

    const problem = validateLogin({ email, senha });
    if (problem) return setError(problem);

    setSubmitting(true);
    const result = await api<LoginResponse>("/api/auth/login", {
      method: "POST",
      json: { email: email.trim(), senha },
      redirectOnUnauthorized: false,
    });
    setSubmitting(false);

    if (!result.ok || !result.data) return setError(result.error);
    const { user } = result.data;
    if (user.status === "EM_ANALISE") return onPending();

    window.dispatchEvent(new Event("loginStateChange"));
    toast.success(`Bem-vindo de volta, ${user.nome}!`);
    router.push(homeFor(user.tipoUser));
  }

  return { email, setEmail, senha, setSenha, error, submitting, submit };
}
