import { describe, expect, it } from "vitest";
import { DOCUMENT_TYPES, IMAGE_TYPES, checkFile, optionalFile, publicIdFromUrl } from "./upload";

const file = (type: string, size: number) => new File([new Uint8Array(size)], "a", { type });

describe("checkFile", () => {
  it("aceita imagem pequena", () => {
    expect(checkFile(file("image/png", 1000), IMAGE_TYPES)).toBeNull();
  });
  it("recusa arquivo grande demais", () => {
    expect(checkFile(file("image/png", 6 * 1024 * 1024), IMAGE_TYPES)).toBe("O arquivo passa de 5 MB. Envie um menor.");
  });
  it("recusa tipo não permitido e explica o que vale", () => {
    expect(checkFile(file("application/pdf", 10), IMAGE_TYPES)).toBe("Envie uma imagem JPG, PNG ou WebP.");
    expect(checkFile(file("text/html", 10), DOCUMENT_TYPES)).toBe("Envie uma imagem (JPG, PNG ou WebP) ou um PDF.");
    expect(checkFile(file("application/pdf", 10), DOCUMENT_TYPES)).toBeNull();
  });
});

describe("optionalFile", () => {
  it("devolve só arquivo com conteúdo", () => {
    expect(optionalFile(null)).toBeNull();
    expect(optionalFile("texto")).toBeNull();
    expect(optionalFile(file("image/png", 0))).toBeNull();
    expect(optionalFile(file("image/png", 3))).not.toBeNull();
  });
});

describe("publicIdFromUrl", () => {
  it("tira o id da URL do Cloudinary", () => {
    expect(publicIdFromUrl("https://res.cloudinary.com/x/image/upload/v1/raiz-conecta/produtos/abc.jpg", "produtos")).toBe("raiz-conecta/produtos/abc");
  });
  it("ignora o que não é do Cloudinary", () => {
    expect(publicIdFromUrl("/uploads/a.jpg", "produtos")).toBeNull();
    expect(publicIdFromUrl(null, "produtos")).toBeNull();
    expect(publicIdFromUrl("", "docs")).toBeNull();
  });
});
