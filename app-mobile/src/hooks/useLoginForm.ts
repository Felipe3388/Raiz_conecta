import { useState } from "react";
import { ApiError } from "@/lib/http";
import { AuthError } from "@/services";
import { useSession } from "./useSession";
import { validateLogin } from "./loginValidation";

const GENERIC_ERROR = "Não foi possível entrar. Tente novamente.";

export function useLoginForm() {
  const { signIn } = useSession();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit() {
    const validationError = validateLogin({ email, senha });
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await signIn(email.trim(), senha);
    } catch (err) {
      const isKnownError = err instanceof ApiError || err instanceof AuthError;
      setError(isKnownError ? err.message : GENERIC_ERROR);
      setIsSubmitting(false);
    }
  }

  return { email, setEmail, senha, setSenha, error, isSubmitting, submit };
}
