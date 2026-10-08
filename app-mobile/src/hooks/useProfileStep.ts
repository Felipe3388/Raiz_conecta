import { useRef, useState } from "react";
import { digitsOnly, maskCep, maskDocument } from "@/lib/format/masks";
import { pickImage, type ImageSource } from "@/lib/media/pickImage";
import { DOCUMENT_TYPES, allowedProofTypes } from "@/lib/registration/rules";
import { validateProfile } from "@/lib/validation/registration";
import { getCepService, getRegistrationService } from "@/services";
import type { DocumentType, ProfileFields } from "@/types/registration";
import { useRegistrationDraft } from "./useRegistration";

const GENERIC_ERROR = "Não foi possível concluir o cadastro. Tente novamente.";

function messageFrom(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

// Controller do passo 2 do cadastro (documento, endereço e comprovante).
export function useProfileStep() {
  const { account, profile, updateProfile, reset } = useRegistrationDraft();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLookingUpCep, setIsLookingUpCep] = useState(false);
  const latestCep = useRef("");

  function update(patch: Partial<ProfileFields>) {
    setError(null);
    updateProfile(patch);
  }

  function setDocumentType(documentType: DocumentType) {
    // O comprovante precisa combinar com o documento: volta para a primeira opção válida.
    update({ documentType, documento: "", proofType: allowedProofTypes(documentType)[0] });
  }

  function setDocument(text: string) {
    update({ documento: maskDocument(text, profile.documentType) });
  }

  async function setCep(text: string) {
    const cep = maskCep(text);
    update({ cep });
    latestCep.current = cep;
    if (digitsOnly(cep).length !== 8) return;

    setIsLookingUpCep(true);
    try {
      const result = await getCepService().lookup(cep);
      if (latestCep.current !== cep) return; // a pessoa já digitou outro CEP
      if (result.found) updateProfile(result.address);
      else setError("CEP não encontrado.");
    } catch (err) {
      if (latestCep.current === cep) setError(messageFrom(err, "Erro ao buscar CEP."));
    } finally {
      if (latestCep.current === cep) setIsLookingUpCep(false);
    }
  }

  async function attach(source: ImageSource) {
    try {
      const attachment = await pickImage(source);
      if (attachment) update({ attachment });
    } catch (err) {
      setError(messageFrom(err, "Não foi possível anexar a foto."));
    }
  }

  // Devolve true quando o cadastro foi enviado e a tela pode seguir para "Conta em análise".
  async function submit(): Promise<boolean> {
    const message = validateProfile(profile);
    setError(message);
    if (message) return false;

    setIsSubmitting(true);
    try {
      await getRegistrationService().register({ account, profile });
      reset();
      return true;
    } catch (err) {
      setError(messageFrom(err, GENERIC_ERROR));
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    account,
    profile,
    documentTypes: DOCUMENT_TYPES,
    proofTypes: allowedProofTypes(profile.documentType),
    error,
    isSubmitting,
    isLookingUpCep,
    update,
    setDocumentType,
    setDocument,
    setCep,
    attach,
    submit,
  };
}
