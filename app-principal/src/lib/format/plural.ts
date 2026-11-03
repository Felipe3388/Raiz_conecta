// plural(1, "conta") → "1 conta"; plural(3, "conta") → "3 contas"; plural(2, "nova", "novas") → "2 novas".
export function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}
