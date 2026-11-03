// Regras dos arquivos enviados (tipo e tamanho). Funções puras, sem nada do servidor: o navegador usa as mesmas
// para avisar a pessoa antes de enviar, e as rotas conferem de novo.

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
// Documentos aceitam também a foto do iPhone (HEIC) e PDF.
export const DOCUMENT_TYPES = [...IMAGE_TYPES, "image/heic", "image/heif", "application/pdf"] as const;
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
// Mensagem de erro se o arquivo não serve (grande demais ou de outro tipo); `null` se está tudo certo.
export function checkFile(file: File, allowed: readonly string[], maxBytes = MAX_UPLOAD_BYTES): string | null {
  if (file.size > maxBytes) return `O arquivo passa de ${Math.round(maxBytes / (1024 * 1024))} MB. Envie um menor.`;
  if (!allowed.includes(file.type)) {
    return allowed.includes("application/pdf") ? "Envie uma imagem (JPG, PNG ou WebP) ou um PDF." : "Envie uma imagem JPG, PNG ou WebP.";
  }
  return null;
}

// Um arquivo opcional de um FormData: `null` se não veio nada.
export function optionalFile(value: FormDataEntryValue | null): File | null {
  return value instanceof File && value.size > 0 ? value : null;
}
