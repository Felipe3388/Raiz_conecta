import { isValidPassword } from "@/lib/auth/password";
import type { EditableProfile } from "@/types/produtor";
import {
  PASSWORDS_DIFFER_MESSAGE,
  firstError,
  required,
  validCep,
  validPhone,
  validUf,
} from "./rules";

// Senha nova é opcional: só é conferida quando a pessoa preencheu um dos dois campos. Nesse caso a senha atual também
// é exigida (a API recusa a troca sem ela).
export function validateProfileEdit(
  fields: EditableProfile,
  newPassword: string,
  confirmPassword: string,
  currentPassword = "",
): string | null {
  const isChangingPassword = newPassword !== "" || confirmPassword !== "";

  return firstError([
    required(fields.nomeFantasia, "Informe o nome fantasia ou razão social."),
    validPhone(fields.telefone),
    validCep(fields.cep),
    required(fields.rua, "Informe a rua ou estrada."),
    required(fields.numero, "Informe o número (ou S/N)."),
    required(fields.cidade, "Informe a cidade."),
    validUf(fields.estado),
    () => (!isChangingPassword || currentPassword !== "" ? null : "Informe a senha atual para trocar a senha."),
    () =>
      !isChangingPassword || newPassword === "" || isValidPassword(newPassword)
        ? null
        : "A nova senha deve ter mínimo 8 caracteres, letra maiúscula, minúscula, número e caractere especial (!@#$%...).",
    () => (!isChangingPassword || newPassword === confirmPassword ? null : PASSWORDS_DIFFER_MESSAGE),
    () => (!isChangingPassword || newPassword === "" || newPassword !== currentPassword ? null : "A nova senha precisa ser diferente da atual."),
  ]);
}
