import type { SuggestionRecord, SuggestionStatus } from "@/types/produtor";

export interface SuggestionStatusInfo {
  label: string;
  variant: "warning" | "success" | "danger";
  help: string;
}

const NO_REASON_HELP = "O produto não entrou no catálogo. Se tiver dúvida, fale com o suporte.";

// Strategy por tabela: cada situação define como aparece, sem cadeia de if.
const STATUS_INFO: Record<SuggestionStatus, (reason?: string) => SuggestionStatusInfo> = {
  EM_ANALISE: () => ({ label: "Em análise", variant: "warning", help: "Nossa equipe ainda vai avaliar." }),
  APROVADA: () => ({ label: "Aprovada", variant: "success", help: "Já está no catálogo. É só marcar." }),
  RECUSADA: (reason) => ({
    label: "Recusada",
    variant: "danger",
    help: reason ? `Não entrou no catálogo: ${reason}` : NO_REASON_HELP,
  }),
};

export function suggestionStatusInfo(status: SuggestionStatus, reason?: string): SuggestionStatusInfo {
  return STATUS_INFO[status](reason);
}

export function newestFirst(suggestions: SuggestionRecord[]): SuggestionRecord[] {
  return [...suggestions].sort((a, b) => Date.parse(b.criadoEm) - Date.parse(a.criadoEm));
}
