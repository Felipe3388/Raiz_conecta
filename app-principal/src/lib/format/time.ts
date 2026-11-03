// "há 5 s", "há 3 min", "há 2 h", "há 4 d": quanto tempo faz, para mostrar na tela.
export function timeAgo(value: Date | string | number | null | undefined, now: Date = new Date()): string {
  if (value === null || value === undefined) return "nunca";
  const seconds = Math.round((now.getTime() - new Date(value).getTime()) / 1000);
  if (Number.isNaN(seconds)) return "nunca";
  if (seconds < 5) return "agora";
  if (seconds < 60) return `há ${seconds} s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  return `há ${Math.floor(hours / 24)} d`;
}

// 27/10/2026
export function formatDate(value: Date | string | number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}
