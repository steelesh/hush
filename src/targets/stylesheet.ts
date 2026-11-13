import type { Colors, Name } from "../palette.ts";

const variables: [string, Name][] = [
  ["bg", "still"],
  ["fg", "voice"],
  ["fg-dim", "whisper"],
  ["fg-faint", "breath"],
  ["accent", "call"],
  ["accent2", "aside"],
  ["border", "trace"],
  ["code-bg", "lull"],
  ["error", "sharp"],
  ["string", "said"],
  ["type", "form"],
  ["selection", "held"],
];

const base = `* { box-sizing: border-box; margin: 0; padding: 0; }

html { scrollbar-color: var(--border) var(--bg); }

body {
  background: var(--bg);
  color: var(--fg);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
  font-size: 16px;
  line-height: 1.7;
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 24px 80px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

::selection { background: var(--selection); }

`;

export function sheet(c: Colors, rules: string): string {
  const body = `${base}${rules}`;
  const used = variables.filter(([name]) => body.includes(`var(--${name})`));
  return `:root {\n  color-scheme: dark;\n${used.map(([name, color]) => `  --${name}: ${c[color]};\n`).join("")}}\n\n${body}`;
}
