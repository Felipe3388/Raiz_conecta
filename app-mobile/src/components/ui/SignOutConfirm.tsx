import { ConfirmModal } from "./ConfirmModal";

interface SignOutConfirmProps {
  visible: boolean;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

// Pergunta "Sair da conta?" antes de encerrar a sessão.
export function SignOutConfirm({ visible, isLoading, onConfirm, onCancel }: SignOutConfirmProps) {
  return (
    <ConfirmModal
      visible={visible}
      variant="danger"
      title="Sair da conta?"
      description="Você precisará entrar de novo."
      confirmLabel="Sim, sair"
      cancelLabel="Ficar"
      isLoading={isLoading}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
