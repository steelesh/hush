import type { Palette } from "../palette.ts";
import type { Target } from "../target.ts";

const theme = ({ colors: c, ansi }: Palette) => `background = ${c.pitch}
foreground = ${c.voice}
cursor-color = ${c.caret}
cursor-text = ${c.pitch}
selection-background = ${c.held}
selection-foreground = cell-foreground
search-background = ${c.tint_search}
search-foreground = ${c.voice}
search-selected-background = ${c.call}
search-selected-foreground = ${c.pitch}
split-divider-color = ${c.trace}
${ansi.map((name, slot) => `palette = ${slot}=${c[name]}`).join("\n")}
`;

export const ghostty: Target = {
  name: "ghostty",
  files: (palette) => [{ path: "themes/ghostty/sotto", content: theme(palette) }],
};
