export const lines = (rows: readonly string[]) => `${rows.join("\n")}\n`;

export const json = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;

export const xml = (text: string) => text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
