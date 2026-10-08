import { useEffect, useRef, useState } from "react";
import { checklistItems, newlyMetLabels, passwordRequirements, type ChecklistItem } from "@/lib/auth/password";

// Depois de cumprido, o item fica um instante com o "feito" e só então sai da lista.
const LINGER_MS = 900;

export interface PasswordChecklistState {
  items: ChecklistItem[];
  anyShown: boolean;
}

export function usePasswordChecklist(password: string): PasswordChecklistState {
  const previous = useRef(passwordRequirements(password));
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [lingering, setLingering] = useState<string[]>([]);

  useEffect(() => {
    const requirements = passwordRequirements(password);
    const done = newlyMetLabels(previous.current, requirements);
    previous.current = requirements;
    if (done.length === 0) return;

    setLingering((current) => [...current, ...done]);
    timers.current.push(
      setTimeout(() => setLingering((current) => current.filter((label) => !done.includes(label))), LINGER_MS),
    );
  }, [password]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const items = checklistItems(password, lingering);
  return { items, anyShown: items.some((item) => item.shown) };
}
