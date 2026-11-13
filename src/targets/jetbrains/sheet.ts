type Value = string | number;
export type Sheet = Record<string, Value>;

export const each = <T>(keys: string[], value: T): Record<string, T> => Object.fromEntries(keys.map((key) => [key, value]));

export const under = <T>(prefix: string, sheet: Record<string, T>): Record<string, T> =>
  Object.fromEntries(Object.entries(sheet).map(([key, value]) => [`${prefix}.${key}`, value]));

export const numbered = <T>(items: readonly T[], key: (number: number) => string, value: (item: T) => Value): Sheet =>
  Object.fromEntries(items.map((item, index) => [key(index + 1), value(item)]));

export function merge<T>(label: string, ...sheets: Record<string, T>[]): Record<string, T> {
  const merged: Record<string, T> = {};
  for (const sheet of sheets) {
    for (const [key, value] of Object.entries(sheet)) {
      if (key in merged) throw new Error(`jetbrains: ${label} sets ${key} twice`);
      merged[key] = value;
    }
  }
  return merged;
}
