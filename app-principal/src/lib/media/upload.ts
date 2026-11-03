import { v2 as cloudinary } from "cloudinary";

// Envio de imagens e documentos para o Cloudinary (o disco do Vercel não guarda arquivos). Um lugar só para a
// configuração, o limite de tamanho/tipo e o prazo: todas as rotas de upload usam isto.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { DOCUMENT_TYPES, IMAGE_TYPES, MAX_UPLOAD_BYTES, checkFile, optionalFile } from "./rules";

const UPLOAD_TIMEOUT_MS = 20_000;

export type Folder = "produtos" | "sugestoes" | "docs";

export async function uploadFile(file: File, folder: Folder, resourceType: "image" | "auto" = "image"): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder: `raiz-conecta/${folder}`, resource_type: resourceType, timeout: UPLOAD_TIMEOUT_MS }, (error, res) => {
        if (error || !res) return reject(error ?? new Error("Upload sem resposta"));
        resolve(res as { secure_url: string });
      })
      .end(buffer);
  });
  return result.secure_url;
}

// "https://res.cloudinary.com/x/image/upload/v1/raiz-conecta/produtos/abc.jpg" -> "raiz-conecta/produtos/abc".
export function publicIdFromUrl(url: string | null | undefined, folder: Folder): string | null {
  if (!url || !url.includes("cloudinary.com")) return null;
  const file = url.split("?")[0].split("/").pop();
  const name = file?.replace(/\.[^.]+$/, "");
  return name ? `raiz-conecta/${folder}/${name}` : null;
}

// Apaga a imagem antiga. Falhar aqui não deve travar quem chamou: a sobra no Cloudinary é só espaço.
export async function removeByUrl(url: string | null | undefined, folder: Folder): Promise<void> {
  const publicId = publicIdFromUrl(url, folder);
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error(JSON.stringify({ level: "warn", event: "upload.remocao_falhou", message: error instanceof Error ? error.message : String(error) }));
  }
}
