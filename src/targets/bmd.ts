import type { Target } from "../target.ts";
import { sheet } from "./stylesheet.ts";

const rules = `h1 {
  font-size: 28px;
  font-weight: 700;
  color: var(--accent2);
  border-bottom: 1px solid var(--border);
  padding-bottom: 8px;
  margin-top: 0;
  margin-bottom: 16px;
  letter-spacing: 0.02em;
}

h2 {
  font-size: 22px;
  font-weight: 700;
  color: var(--accent2);
  border-bottom: 1px solid var(--border);
  padding-bottom: 6px;
  margin-top: 36px;
  margin-bottom: 12px;
  letter-spacing: 0.02em;
}

h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--accent2);
  margin-top: 28px;
  margin-bottom: 8px;
}

h4 {
  font-size: 16px;
  font-weight: 600;
  color: var(--accent2);
  margin-top: 24px;
  margin-bottom: 6px;
}

h5, h6 {
  font-size: 14px;
  font-weight: 600;
  color: var(--fg-dim);
  margin-top: 20px;
  margin-bottom: 4px;
}

p { margin: 10px 0; }

a { color: var(--accent2); text-decoration: none; }
a:hover { text-decoration: underline; }
a:active { opacity: 0.8; }

strong { font-weight: 700; color: var(--fg); }
em, i { font-style: normal; text-decoration: underline; }

code, pre {
  font-family: ui-monospace, "SF Mono", Menlo, monospace;
  font-size: 14px;
}

code {
  color: var(--string);
  background: var(--code-bg);
  padding: 2px 6px;
  border-radius: 3px;
}

pre {
  background: var(--code-bg);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 14px 18px;
  margin: 14px 0;
  overflow-x: auto;
  line-height: 1.5;
}

pre > code {
  color: var(--fg);
  background: none;
  padding: 0;
  border-radius: 0;
  font-size: 14px;
}

blockquote {
  border-left: 3px solid var(--border);
  padding: 4px 0 4px 16px;
  margin: 14px 0;
  color: var(--fg-dim);
}

blockquote p { margin: 4px 0; }

blockquote blockquote { margin: 8px 0; }

ul, ol {
  margin: 10px 0;
  padding-left: 24px;
}

li { margin: 4px 0; }
li > ul, li > ol { margin: 2px 0; }

hr {
  border: none;
  border-top: 1px solid var(--border);
  margin: 28px 0;
}

table {
  border-collapse: collapse;
  margin: 14px 0;
  width: 100%;
  overflow-x: auto;
  display: block;
}

thead { border-bottom: 2px solid var(--border); }

th {
  font-weight: 600;
  color: var(--accent2);
  text-align: left;
  padding: 8px 12px;
  font-size: 14px;
}

td {
  padding: 6px 12px;
  border-bottom: 1px solid var(--border);
  vertical-align: top;
}

tr:last-child td { border-bottom: none; }

img {
  max-width: 100%;
  height: auto;
  border-radius: 6px;
  margin: 14px 0;
}

dl { margin: 10px 0; }
dt { font-weight: 600; color: var(--fg); margin-top: 12px; }
dd { margin-left: 24px; margin-top: 2px; }
`;

export const bmd: Target = {
  name: "bmd",
  files: ({ colors }) => [{ path: "themes/bmd/sotto.css", content: sheet(colors, rules) }],
};
