import { useState } from "react";
import { maskPhone } from "@/lib/format/masks";
import { validateAccount } from "@/lib/validation/registration";
import type { AccountFields } from "@/types/registration";
import { useRegistrationDraft } from "./useRegistration";

// Controller do passo 1 do cadastro (dados da conta).
export function useAccountStep() {
  const { account, updateAccount } = useRegistrationDraft();
  const [error, setError] = useState<string | null>(null);

  function update(patch: Partial<AccountFields>) {
    setError(null);
    updateAccount(patch);
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
