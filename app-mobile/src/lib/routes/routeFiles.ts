const SCREEN_FILE = /\.(tsx|ts|jsx|js)$/;

// Endereço de uma tela a partir do caminho do arquivo em src/app: os grupos `(nome)` não entram no endereço.
export function routeUrl(file: string): string {
  const parts = file
    .replace(SCREEN_FILE, "")
    .split("/")
    .filter((part) => !/^\(.*\)$/.test(part));
  if (parts[parts.length - 1] === "index") parts.pop();
  return `/${parts.join("/")}`;
}

function isScreen(file: string): boolean {
  const name = file.split("/").pop() ?? "";
  return SCREEN_FILE.test(name) && !name.startsWith("_") && !name.startsWith("+");
}

export interface DuplicateRoute {
  url: string;
  files: string[];
}

// Endereços com mais de um arquivo. O Expo Router escolhe um deles sem avisar.
export function duplicateRoutes(files: string[]): DuplicateRoute[] {
  const byUrl = new Map<string, string[]>();
  for (const file of files.filter(isScreen)) {
    const url = routeUrl(file);
    byUrl.set(url, [...(byUrl.get(url) ?? []), file]);
  }
  return [...byUrl.entries()]
    .filter(([, group]) => group.length > 1)
    .map(([url, group]) => ({ url, files: [...group].sort() }));
}
