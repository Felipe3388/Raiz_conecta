// O id da balança é o endereço MAC do módulo (6 pares hexadecimais). Guardado sem separadores e em maiúsculas;
// mostrado como "A4:CF:12:9B:07:E1". Aceita qualquer forma: "a4:cf:12:9b:07:e1", "A4-CF-12-9B-07-E1", "a4cf129b07e1".

export function normalizeDeviceId(value: string): string {
  return value.replace(/[^0-9a-z]/gi, "").toUpperCase();
}

export function isValidDeviceId(value: string): boolean {
  return /^[0-9A-F]{12}$/.test(normalizeDeviceId(value));
}

export function formatDeviceId(value: string): string {
  return normalizeDeviceId(value).match(/.{1,2}/g)?.join(":") ?? "";
}
