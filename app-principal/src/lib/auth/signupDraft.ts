// Os dados do passo 1 do cadastro (inclui a senha) esperam o passo 2 só na memória da página: nada de storage do
// navegador. Recarregar a página volta ao passo 1, e é de propósito (a senha não fica gravada em lugar nenhum).

export interface SignupDraft {
  tipoUsuario: string;
  nome: string;
  email: string;
  telefone: string;
  senha: string;
  confirmarSenha: string;
}

// Depois do envio só sobra o que a tela "cadastro enviado" mostra (nunca a senha).
export interface SignupSent {
  email: string;
  primeiroNome: string;
}

let draft: SignupDraft | null = null;
let sent: SignupSent | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

export const readSignupDraft = (): SignupDraft | null => draft;

export function saveSignupDraft(next: SignupDraft): void {
  draft = { ...next };
  notify();
}

export function clearSignupDraft(): void {
  draft = null;
  notify();
}

// Cadastro enviado: apaga o rascunho (com a senha) e guarda só o e-mail e o primeiro nome para a tela seguinte.
export function finishSignup(): SignupSent | null {
  if (!draft) return null;
  sent = { email: draft.email.trim(), primeiroNome: draft.nome.trim().split(/\s+/)[0] ?? "" };
  draft = null;
  notify();
  return sent;
}

export const readSignupSent = (): SignupSent | null => sent;

export function subscribeSignupDraft(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
