function plain(value: number): string {
  const safe = Number.isFinite(value) ? Math.abs(value) : 0;
  const [integer, decimals = ""] = (Math.round(safe * 1000) / 1000).toFixed(3).split(".");
  const withDots = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const trimmed = decimals.replace(/0+$/, "");
  return trimmed ? `${withDots},${trimmed}` : withDots;
}

// Peso no padrão brasileiro: 9,88 kg, 10 kg, 1.234,5 kg.
export function formatKg(value: number): string {
  return `${plain(value)} kg`;
}

// Com sinal, para dizer quanto falta ou sobra: +1,5 kg, −0,12 kg.
export function formatSignedKg(value: number): string {
  if (!Number.isFinite(value) || Math.round(value * 1000) === 0) return "0 kg";
  return `${value > 0 ? "+" : "−"}${plain(value)} kg`;
}

export function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return "0%";
  const rounded = Math.round(value * 10) / 10;
  if (rounded === 0) return "0%";
  const [integer, decimals] = Math.abs(rounded).toFixed(1).split(".");
  const body = decimals === "0" ? integer : `${integer},${decimals}`;
  return `${rounded < 0 ? "−" : ""}${body}%`;
}

// Para preencher o campo de digitar o peso: 9,88.
export function formatKgInput(value: number): string {
  return plain(value).replace(/\./g, "");
}
