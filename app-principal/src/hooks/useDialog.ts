"use client";

import { useEffect, useRef } from "react";

// Janelas abertas, da mais antiga para a mais nova. Só a de cima reage ao Esc e prende o foco
// (uma confirmação aberta por cima de outra janela não fecha as duas de uma vez).
const stack: symbol[] = [];

const FOCUSABLE = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Comportamento esperado de uma janela modal: Esc fecha, Tab não escapa dela, a página de trás não rola e,
// ao fechar, o foco volta para o botão que a abriu. Devolve a ref que vai na janela.
export function useDialog<T extends HTMLElement>(open: boolean, onClose: () => void) {
  const ref = useRef<T>(null);
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const id = Symbol("dialog");
    stack.push(id);
    const opener = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const node = ref.current;
    const focusables = () => (node ? Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null || el === document.activeElement) : []);
    // Foco inicial: o campo marcado com data-autofocus, senão o primeiro item do corpo, senão a própria janela.
    const body = node?.querySelector<HTMLElement>("[data-dialog-body]");
    const initial = node?.querySelector<HTMLElement>("[data-autofocus]") ?? body?.querySelector<HTMLElement>(FOCUSABLE) ?? focusables()[0] ?? node;
    initial?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (stack[stack.length - 1] !== id) return;
      if (event.key === "Escape") {
        event.preventDefault();
        closeRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) {
        event.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      stack.splice(stack.indexOf(id), 1);
      document.body.style.overflow = stack.length === 0 ? previousOverflow : "hidden";
      opener?.focus?.();
    };
  }, [open]);

  return ref;
}
