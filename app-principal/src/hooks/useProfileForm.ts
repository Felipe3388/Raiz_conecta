"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { refreshSession } from "@/hooks/useSession";
import { logout } from "@/lib/auth/logout";
import { api } from "@/lib/http/client";
import {
  isChangingPassword, isProfileDirty, NO_PASSWORD_CHANGE, profileRequest, reviewProfile, toProfileForm,
  type PasswordChange, type PerfilDto, type ProfileForm,
} from "@/lib/perfil/form";

// Controller do "Meu perfil" (produtor e mercado): carrega, edita, confirma antes de salvar ou excluir.
// As regras ficam em lib/perfil/form; aqui só o fluxo da tela.
export function useProfileForm({ onSaved }: { onSaved?: () => void } = {}) {
  const router = useRouter();
  const [saved, setSaved] = useState<{ dto: PerfilDto; form: ProfileForm } | null>(null);
  const [form, setForm] = useState<ProfileForm | null>(null);
  const [error, setError] = useState("");
  const [passwords, setPasswords] = useState<PasswordChange>(NO_PASSWORD_CHANGE);
  const [confirming, setConfirming] = useState<"save" | "delete" | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const result = await api<PerfilDto>("/api/perfil/meus-dados", { cache: "no-store" });
    if (!result.ok || !result.data) return void setError(result.error);
    const next = { dto: result.data, form: toProfileForm(result.data) };
    setSaved(next);
    setForm(next.form);
    setError("");
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial da tela: o estado é preenchido quando a resposta chega
    void load();
  }, [load]);

  const update = (patch: Partial<ProfileForm>) => setForm((current) => (current ? { ...current, ...patch } : current));
  const setPassword = (field: keyof PasswordChange, value: string) => setPasswords((current) => ({ ...current, [field]: value }));

  function requestSave() {
    if (!form) return;
    const problem = reviewProfile(form, passwords);
    if (problem) return void toast.warning(problem);
    setConfirming("save");
  }

  async function save() {
    if (!form) return;
    const changedPassword = isChangingPassword(passwords);
    setBusy(true);
    const result = await api("/api/perfil/meus-dados", { method: "PUT", json: profileRequest(form, passwords) });
    setBusy(false);
    setConfirming(null);
    if (!result.ok) return void toast.error(result.error);

    toast.success(changedPassword ? "Perfil e senha atualizados!" : "Perfil atualizado com sucesso!");
    setPasswords(NO_PASSWORD_CHANGE);
    await load();
    void refreshSession(); // a barra do topo mostra o nome novo
    onSaved?.();
  }

  async function removeAccount() {
    setBusy(true);
    const result = await api("/api/perfil/meus-dados", { method: "DELETE" });
    setBusy(false);
    setConfirming(null);
    if (!result.ok) return void toast.error("Não foi possível excluir a conta.", { description: result.error });
    toast.success("Conta excluída. Sentiremos sua falta!");
    await logout();
    router.push("/");
  }

  return {
    dto: saved?.dto ?? null,
    form,
    error,
    reload: load,
    update,
    passwords,
    setPassword,
    changingPassword: isChangingPassword(passwords),
    dirty: Boolean(form && saved && isProfileDirty(form, saved.form, passwords)),
    confirming,
    busy,
    requestSave,
    requestDelete: () => setConfirming("delete"),
    cancel: () => setConfirming(null),
    save,
    removeAccount,
  };
}

export type ProfileFormController = ReturnType<typeof useProfileForm>;
