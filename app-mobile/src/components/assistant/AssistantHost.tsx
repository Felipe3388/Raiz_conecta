import { usePathname, useRouter } from "expo-router";
import { SuggestionModal } from "@/components/produtor/SuggestionModal";
import { useAssistant } from "@/hooks/useAssistant";
import { screenFromPath, type FabActionId } from "@/lib/assistant/fabActions";
import { AssistantFab } from "./AssistantFab";
import { HelpChatModal } from "./HelpChatModal";
import { MySuggestionsModal } from "./MySuggestionsModal";
import { UndoSheet } from "./UndoSheet";

// Tudo do assistente num lugar só, acima de todas as telas do Produtor: o botão e as janelas que ele abre.
export function AssistantHost() {
  const screen = screenFromPath(usePathname());
  const router = useRouter();
  const { modal, open, close } = useAssistant();

  // Strategy por tabela: cada opção do botão sabe o que fazer.
  const handlers: Record<FabActionId, () => void> = {
    help: () => open("help"),
    suggest: () => open("suggest"),
    mySuggestions: () => open("mySuggestions"),
    goCatalog: () => router.navigate("/catalogo"),
    goMural: () => router.navigate("/mural"),
    undo: () => open("undo"),
  };

  return (
    <>
      <AssistantFab screen={screen} onAction={(id) => handlers[id]()} />
      <SuggestionModal visible={modal === "suggest"} onClose={close} />
      <HelpChatModal visible={modal === "help"} screen={screen} onClose={close} />
      <MySuggestionsModal visible={modal === "mySuggestions"} onClose={close} onSuggest={() => open("suggest")} />
      <UndoSheet visible={modal === "undo"} onClose={close} />
    </>
  );
}
