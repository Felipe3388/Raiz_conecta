"use client";

import { useSyncExternalStore } from "react";
import { readSignupDraft, subscribeSignupDraft, type SignupDraft } from "@/lib/auth/signupDraft";

// O passo 1 do cadastro, lido da memória da página. No servidor não existe (null).
export function useSignupDraft(): SignupDraft | null {
  return useSyncExternalStore(subscribeSignupDraft, readSignupDraft, () => null);
}
