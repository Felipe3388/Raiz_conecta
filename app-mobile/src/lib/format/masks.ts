import type { DocumentType } from "@/types/registration";

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

// (11) 99999-9999
export function maskPhone(value: string): string {
  const digits = digitsOnly(value).slice(0, 11);

  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`.replace(/-$/, "");
}

const DOCUMENT_PATTERNS: Record<DocumentType, { maxDigits: number; groups: number[]; separators: string[] }> = {
  CPF: { maxDigits: 11, groups: [3, 3, 3, 2], separators: [".", ".", "-"] },
  CNPJ: { maxDigits: 14, groups: [2, 3, 3, 4, 2], separators: [".", ".", "/", "-"] },
};

// CPF: 123.456.789-01 | CNPJ: 12.345.678/0001-99
export function maskDocument(value: string, type: DocumentType): string {
  const { maxDigits, groups, separators } = DOCUMENT_PATTERNS[type];
  const digits = digitsOnly(value).slice(0, maxDigits);

  let result = "";
  let position = 0;
  groups.forEach((size, index) => {
    const part = digits.slice(position, position + size);
    if (!part) return;
    result += (index > 0 ? separators[index - 1] : "") + part;
    position += size;
  });
  return result;
}

// 12345-678
export function maskCep(value: string): string {
  const digits = digitsOnly(value).slice(0, 8);
  return digits.length <= 5 ? digits : `${digits.slice(0, 5)}-${digits.slice(5)}`;
}
