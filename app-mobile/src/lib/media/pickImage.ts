import * as ImagePicker from "expo-image-picker";
import type { Attachment } from "@/types/registration";

export type ImageSource = "camera" | "gallery";

const MAX_BYTES = 5 * 1024 * 1024;

// Devolve null quando a pessoa cancela; lança Error com mensagem pronta para exibir nos demais casos.
export async function pickImage(source: ImageSource): Promise<Attachment | null> {
  const options: ImagePicker.ImagePickerOptions = { mediaTypes: ["images"], quality: 0.7 };

  const result =
    source === "camera"
      ? await launchCamera(options)
      : await ImagePicker.launchImageLibraryAsync(options);

  if (result.canceled) return null;

  const [asset] = result.assets;
  if (asset.fileSize && asset.fileSize > MAX_BYTES) {
    throw new Error("A foto deve ter no máximo 5 MB.");
  }

  return {
    uri: asset.uri,
    name: asset.fileName ?? `comprovante-${Date.now()}.jpg`,
    mimeType: asset.mimeType ?? "image/jpeg",
  };
}

async function launchCamera(options: ImagePicker.ImagePickerOptions) {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    throw new Error("Permita o acesso à câmera nas configurações, ou escolha da galeria.");
  }
  return ImagePicker.launchCameraAsync(options);
}
