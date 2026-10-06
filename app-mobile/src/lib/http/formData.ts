import { Platform } from "react-native";
import type { Attachment } from "@/types/registration";

// No navegador o arquivo precisa virar Blob; no celular o React Native aceita { uri, name, type }.
export async function appendAttachment(
  form: FormData,
  field: string,
  file: Attachment,
): Promise<void> {
  if (Platform.OS === "web") {
    const blob = await (await fetch(file.uri)).blob();
    form.append(field, blob, file.name);
    return;
  }

  form.append(field, { uri: file.uri, name: file.name, type: file.mimeType } as unknown as Blob);
}
