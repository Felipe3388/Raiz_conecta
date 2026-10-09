import {
  activeUndo,
  MAX_UNDO_ENTRIES,
  nextExpiry,
  pushUndo,
  removeUndo,
  UNDO_WINDOW_MS,
  type UndoEntry,
} from "./undoStack";

const entry = (id: number, expiresAt = 1000 + id): UndoEntry => ({
  id,
  label: `ação ${id}`,
  run: async () => {},
  expiresAt,
});

describe("pilha de desfazer", () => {
  it("a ação mais recente vem primeiro", () => {
    const stack = pushUndo(pushUndo([], entry(1)), entry(2));
    expect(stack.map((item) => item.id)).toEqual([2, 1]);
  });

  it("guarda só as últimas ações", () => {
    let stack: UndoEntry[] = [];
    for (let id = 1; id <= MAX_UNDO_ENTRIES + 3; id++) stack = pushUndo(stack, entry(id));
    expect(stack).toHaveLength(MAX_UNDO_ENTRIES);
    expect(stack[0].id).toBe(MAX_UNDO_ENTRIES + 3);
  });

  it("tira uma ação pelo código", () => {
    const stack = pushUndo(pushUndo([], entry(1)), entry(2));
    expect(removeUndo(stack, 2).map((item) => item.id)).toEqual([1]);
    expect(removeUndo(stack, 99)).toEqual(stack);
  });

  it("ações que passaram do prazo deixam de valer", () => {
    const stack = [entry(2, 5000), entry(1, 2000)];
    expect(activeUndo(stack, 3000).map((item) => item.id)).toEqual([2]);
    expect(activeUndo(stack, 5000)).toEqual([]);
  });

  it("diz quando a próxima ação vence, para a tela se atualizar nessa hora", () => {
    expect(nextExpiry([entry(2, 5000), entry(1, 2000)], 1000)).toBe(2000);
    expect(nextExpiry([entry(1, 2000)], 2000)).toBeNull();
    expect(nextExpiry([], 0)).toBeNull();
  });

  it("o prazo para desfazer é de um minuto", () => {
    expect(UNDO_WINDOW_MS).toBe(60_000);
  });
});
