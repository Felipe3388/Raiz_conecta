const WEEKDAYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const pad = (value: number) => String(value).padStart(2, "0");

// Dias são guardados como texto "AAAA-MM-DD" (no fuso do aparelho), sem hora: entrega é de um dia, não de um instante.
export function dayKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// Meio-dia: o horário de verão nunca empurra a data para outro dia.
function parseDay(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

export function addDays(key: string, days: number): string {
  const date = parseDay(key);
  date.setDate(date.getDate() + days);
  return dayKey(date);
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Quantos dias faltam de hoje até o dia (negativo = já passou).
export function dayOffset(key: string, today: Date): number {
  return Math.round((parseDay(key).getTime() - parseDay(dayKey(today)).getTime()) / MS_PER_DAY);
}

// "qui, 08/10".
export function weekdayLabel(key: string): string {
  const date = parseDay(key);
  return `${WEEKDAYS[date.getDay()]}, ${pad(date.getDate())}/${pad(date.getMonth() + 1)}`;
}

const NAMED_DAYS: Record<number, string> = { [-1]: "Ontem", 0: "Hoje", 1: "Amanhã" };

export function dayLabel(key: string, today: Date): string {
  return NAMED_DAYS[dayOffset(key, today)] ?? weekdayLabel(key);
}

// Dias da semana em que há entrega (0 = domingo): terça e sexta. Quem define são os adms; por enquanto é fixo aqui,
// e as regras recebem a lista por parâmetro para ela poder vir do servidor depois.
export const DELIVERY_WEEKDAYS: number[] = [2, 5];

export function isDeliveryDay(key: string, weekdays: number[] = DELIVERY_WEEKDAYS): boolean {
  return weekdays.includes(parseDay(key).getDay());
}

// Os próximos dias de entrega a partir de hoje (hoje conta, se for um deles).
export function nextDeliveryDays(today: Date, count: number, weekdays: number[] = DELIVERY_WEEKDAYS): string[] {
  if (weekdays.length === 0) return [];
  const days: string[] = [];
  let key = dayKey(today);
  while (days.length < count) {
    if (isDeliveryDay(key, weekdays)) days.push(key);
    key = addDays(key, 1);
  }
  return days;
}

// "Hoje, ter 13/10" ou "sex, 16/10": como o dia de entrega aparece nas abas.
export function deliveryDayLabel(key: string, today: Date): string {
  const label = weekdayLabel(key).replace(",", "");
  return dayOffset(key, today) === 0 ? `Hoje, ${label}` : weekdayLabel(key);
}
