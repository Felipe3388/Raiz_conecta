import { useState } from "react";
import { maskPhone } from "@/lib/format/masks";
import { profileDefaults } from "@/lib/registration/rules";
import { validateAccount } from "@/lib/validation/registration";
import type { AccountFields } from "@/types/registration";
import { useRegistrationDraft } from "./useRegistration";

// Controller do passo 1 do cadastro (dados da conta).
export function useAccountStep() {
  const { account, updateAccount, updateProfile } = useRegistrationDraft();
  const [error, setError] = useState<string | null>(null);

  function update(patch: Partial<AccountFields>) {
    setError(null);
    updateAccount(patch);
    // Trocar de perfil muda os documentos permitidos (mercado só aceita CNPJ).
    if (patch.profile && patch.profile !== account.profile) {
      updateProfile(profileDefaults(patch.profile));
    }
  }

  function setPhone(text: string) {
    update({ telefone: maskPhone(text) });
  }

  // Devolve true quando os dados estão válidos e a tela pode avançar.
  function submit(): boolean {
    const message = validateAccount(account);
    setError(message);
    return message === null;
  }

  return { account, update, setPhone, error, submit };
}
