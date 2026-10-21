import type { ScaleLink } from "@/types/scaleLink";

export const SCALE_SETUP = {
  title: "Balança",
  intro: "Conecte a balança ao seu celular para pesar sem digitar. Leva só 2 passos e é feito uma vez.",
  banner: { title: "Conecte sua balança", description: "2 passos para pesar os pedidos sem digitar." },
  steps: {
    find: { number: 1, title: "Escolha a balança", hint: "Ligue a balança e deixe-a perto do celular." },
    confirm: { number: 2, title: "Confirme o vínculo", hint: "A balança passa a valer só para a sua conta." },
  },
  search: "Procurar balanças",
  searching: "Procurando balanças…",
  none: "Nenhuma balança encontrada. Confira se ela está ligada e procure de novo.",
  confirm: "Vincular balança",
  back: "Trocar de balança",
  linkedTitle: "Balança conectada",
  unlink: "Desvincular balança",
  unlinkTitle: "Desvincular a balança?",
  unlinkDescription: "Você poderá vincular de novo quando quiser. Os pesos já registrados não mudam.",
  linkedHint: "Pronta para pesar. Os pesos chegam ao celular sem digitar.",
  linkedToast: "Balança vinculada!",
  unlinkedToast: "Balança desvinculada.",
} as const;

// A linha da aba Mais para a balança.
export function scaleRowDescription(link: ScaleLink | null): string {
  return link ? `Conectada: ${link.deviceName}` : "Não conectada. Toque para conectar em 2 passos.";
}
