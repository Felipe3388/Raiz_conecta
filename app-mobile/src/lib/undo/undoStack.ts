// Quanto tempo depois de uma ação ainda dá para desfazê-la.
export const UNDO_WINDOW_MS = 60_000;
// Quantas ações recentes ficam guardadas.
export const MAX_UNDO_ENTRIES = 5;

export interface UndoEntry {
  id: number;
  // O que será desfeito, em poucas palavras ("Oferta de Tomate").
  label: string;
  run: () => Promise<void>;
  expiresAt: number;
}

// A mais recente fica na frente; as mais antigas além do limite saem.
export function pushUndo(stack: UndoEntry[], entry: UndoEntry): UndoEntry[] {
  return [entry, ...stack].slice(0, MAX_UNDO_ENTRIES);
}

export function removeUndo(stack: UndoEntry[], id: number): UndoEntry[] {
  return stack.some((item) => item.id === id) ? stack.filter((item) => item.id !== id) : stack;
}

export function activeUndo(stack: UndoEntry[], now: number): UndoEntry[] {
  return stack.filter((item) => item.expiresAt > now);
}

// Quando a próxima ação deixa de valer (para a tela se atualizar nessa hora).
export function nextExpiry(stack: UndoEntry[], now: number): number | null {
  const upcoming = stack.map((item) => item.expiresAt).filter((time) => time > now);
  return upcoming.length > 0 ? Math.min(...upcoming) : null;
}
