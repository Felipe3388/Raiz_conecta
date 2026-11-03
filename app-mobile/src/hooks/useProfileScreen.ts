import { useCallback, useEffect, useState } from "react";
import { maskCep, maskPhone } from "@/lib/format/masks";
import { ApiError } from "@/lib/http/ApiError";
import { validateProfileEdit } from "@/lib/validation/profileEdit";
import { getProfileService, type ProfileGateway } from "@/services";
import type { EditableProfile, ProducerProfile } from "@/types/produtor";
import { useContactSupport } from "./useContactSupport";
import { useSession } from "./useSession";
import { useToast } from "./useToast";
import { useUndo } from "./useUndo";

type LoadStatus = "loading" | "ready" | "error";

// A API explica o motivo (senha atual errada, pedidos vinculados...): isso vale mais do que um aviso genérico.
function serverReason(error: unknown): string | undefined {
  return error instanceof ApiError && error.message ? error.message : undefined;
}

const EMPTY_FORM: EditableProfile = {
  nomeFantasia: "",
  telefone: "",
  cep: "",
  rua: "",
  numero: "",
  cidade: "",
  estado: "",
};

function editableFrom(profile: ProducerProfile): EditableProfile {
  const { nomeFantasia, telefone, cep, rua, numero, cidade, estado } = profile;
  return { nomeFantasia, telefone, cep, rua, numero, cidade, estado };
}

// Controller do Meu Perfil: carrega, edita com máscaras, confirma antes de salvar ou excluir.
export function useProfileScreen(
  email: string,
  // Avisa quando o nome muda, para o círculo da conta no cabeçalho acompanhar.
  onNameChanged: (name: string) => void = () => {},
  gateway: ProfileGateway = getProfileService(),
) {
  const { signOut } = useSession();
  const toast = useToast();
  const undo = useUndo();
  const contactSupport = useContactSupport();
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [profile, setProfile] = useState<ProducerProfile | null>(null);
  const [form, setForm] = useState<EditableProfile>(EMPTY_FORM);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isConfirmingSave, setIsConfirmingSave] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const loaded = await gateway.getProfile(email);
      setProfile(loaded);
      setForm(editableFrom(loaded));
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, [gateway, email]);

  useEffect(() => {
    load();
  }, [load]);

  function setField(field: keyof EditableProfile, text: string) {
    const formatted =
      field === "telefone"
        ? maskPhone(text)
        : field === "cep"
          ? maskCep(text)
          : field === "estado"
            ? text.toUpperCase()
            : text;
    setForm((current) => ({ ...current, [field]: formatted }));
  }

  function requestSave() {
    const message = validateProfileEdit(form, newPassword, confirmPassword, currentPassword);
    if (message) toast.show("warning", message);
    else setIsConfirmingSave(true);
  }

  async function confirmSave() {
    setIsSaving(true);
    try {
      const before = profile ? editableFrom(profile) : null;
      const changedPassword = newPassword !== "";
      const updated = await gateway.updateProfile(
        email,
        form,
        changedPassword ? { current: currentPassword, next: newPassword } : undefined,
      );
      setProfile(updated);
      onNameChanged(updated.nomeFantasia);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      // A senha antiga não é guardada, então só dá para desfazer quando a senha não mudou.
      if (before && !changedPassword) {
        undo.announce({
          title: "Perfil atualizado com sucesso!",
          label: "Dados do perfil",
          revert: async () => {
            const restored = await gateway.updateProfile(email, before);
            setProfile(restored);
            setForm(editableFrom(restored));
            onNameChanged(restored.nomeFantasia);
          },
        });
      } else {
        toast.show("success", "Perfil atualizado com sucesso!");
      }
    } catch (error) {
      toast.show("error", "Erro ao atualizar os dados.", serverReason(error));
    } finally {
      setIsSaving(false);
      setIsConfirmingSave(false);
    }
  }

  async function confirmDelete() {
    setIsDeleting(true);
    try {
      await gateway.deleteAccount(email);
      toast.show("success", "Conta excluída. Sentiremos sua falta!");
      await signOut();
    } catch (error) {
      toast.show(
        "error",
        "Não foi possível excluir a conta.",
        serverReason(error) ?? "Pode haver histórico de pedidos vinculados a ela.",
      );
      setIsConfirmingDelete(false);
    } finally {
      setIsDeleting(false);
    }
  }

  return {
    status,
    profile,
    form,
    setField,
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    requestSave,
    confirmSave,
    isConfirmingSave,
    cancelSave: () => setIsConfirmingSave(false),
    isSaving,
    requestDelete: () => setIsConfirmingDelete(true),
    confirmDelete,
    isConfirmingDelete,
    cancelDelete: () => setIsConfirmingDelete(false),
    isDeleting,
    contactSupport,
    reload: load,
  };
}
