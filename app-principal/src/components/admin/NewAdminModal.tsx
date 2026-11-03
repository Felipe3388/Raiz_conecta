"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PasswordField } from "@/components/auth/PasswordField";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { api } from "@/lib/http/client";
import { EMAIL_MESSAGE, PASSWORD_MESSAGE, isValidEmail, isValidPassword } from "@/lib/validation/auth";

interface NewAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function NewAdminModal({ isOpen, onClose, onCreated }: NewAdminModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Criar novo administrador">
      {isOpen && <NewAdminForm onClose={onClose} onCreated={onCreated} />}
    </Modal>
  );
}

function NewAdminForm({ onClose, onCreated }: Omit<NewAdminModalProps, "isOpen">) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (!isValidEmail(email)) return setError(EMAIL_MESSAGE);
    if (!isValidPassword(senha)) return setError(PASSWORD_MESSAGE);
    setError("");

    setBusy(true);
    const result = await api("/api/admin/novo-admin", { method: "POST", json: { email: email.trim(), senha } });
    setBusy(false);
    if (!result.ok) return setError(result.error);

    toast.success("Novo administrador criado!");
    onCreated();
    onClose();
  }

  return (
    <form onSubmit={submit} className="space-y-4 mt-2">
      <p className="text-sm text-gray-500">O novo administrador terá acesso total ao painel. Crie uma senha forte.</p>
      <Input label="E-mail de acesso" type="email" autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@raizconecta.com.br" required data-autofocus />
      <PasswordField label="Senha" value={senha} onChange={setSenha} autoComplete="new-password" showStrength />
      {error && <p role="alert" className="text-sm font-medium text-red-600">{error}</p>}
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={busy} className="flex-1 border-gray-200 text-gray-600">Cancelar</Button>
        <Button type="submit" isLoading={busy} className="flex-1 bg-gray-900 hover:bg-black">Criar conta</Button>
      </div>
    </form>
  );
}
