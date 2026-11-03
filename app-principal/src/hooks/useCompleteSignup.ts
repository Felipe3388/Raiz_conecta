"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { AddressValue } from "@/components/forms/AddressFields";
import { finishSignup, readSignupDraft } from "@/lib/auth/signupDraft";
import { buildSignupForm, EMPTY_STEP2, type SignupStep2 } from "@/lib/auth/signupForm";
import { api } from "@/lib/http/client";
import { useSignupDraft } from "./useSignupDraft";

// Controller do passo 2 do cadastro: os campos, o arquivo e o envio. Sem o passo 1 volta para o começo.
export function useCompleteSignup() {
  const router = useRouter();
  const draft = useSignupDraft();
  const [form, setForm] = useState<SignupStep2>(EMPTY_STEP2);
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    // Lê de novo na hora: no primeiro render após a hidratação `draft` ainda pode ser o valor do servidor (vazio).
    if (readSignupDraft()) return;
    toast.error("Comece pelo passo 1 do cadastro.");
    router.replace("/login?modo=cadastro");
  }, [router]);

  const set = <K extends keyof SignupStep2>(field: K, value: SignupStep2[K]) => setForm((current) => ({ ...current, [field]: value }));
  const setAddress = (patch: Partial<AddressValue>) => setForm((current) => ({ ...current, ...patch }));
  // Trocar CPF ↔ CNPJ limpa o número (as máscaras são diferentes).
  const setTipoDoc = (tipoDoc: string) => setForm((current) => ({ ...current, tipoDoc, documento: "" }));

  async function submit() {
    const step1 = readSignupDraft();
    if (!step1 || sending) return;
    const built = buildSignupForm(step1, form, file);
    if (!built.ok) return void toast.warning(built.error);

    setSending(true);
    const result = await api("/api/auth/cadastro", { method: "POST", form: built.body, redirectOnUnauthorized: false });
    setSending(false);
    if (!result.ok) return void toast.error(result.error);

    finishSignup();
    router.push("/cadastro-enviado");
  }

  return { draft, form, set, setAddress, setTipoDoc, file, setFile, sending, submit, back: () => router.push("/login?modo=cadastro") };
}
