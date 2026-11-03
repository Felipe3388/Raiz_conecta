// Máscaras de campos enquanto a pessoa digita. Só formatam: quem valida são as regras de lib/validation.
const onlyDigits = (value: string) => value.replace(/\D/g, "");

// 17500000 → 17500-000
export function maskCep(value: string): string {
  const digits = onlyDigits(value).slice(0, 8);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
}

// CPF: 000.000.000-00 · CNPJ: 00.000.000/0000-00
export function maskDocumento(tipoDoc: string, value: string): string {
  if (tipoDoc === "CNPJ") {
    const d = onlyDigits(value).slice(0, 14);
    return d
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }
  const d = onlyDigits(value).slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

// Sigla do estado: só letras, maiúsculas, 2 posições.
export function maskUf(value: string): string {
  return value.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 2);
}
