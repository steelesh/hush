import type { Colors } from "../palette.ts";
import type { Target } from "../target.ts";
import { json } from "../text.ts";

const theme = (c: Colors) =>
  json({
    logo: { color: Object.fromEntries(Array.from({ length: 9 }, (_, slot) => [slot + 1, c.breath])) },
    display: {
      color: { keys: c.murmur, title: c.call, output: c.voice },
      percent: { color: { green: c.grown, yellow: c.flat, red: c.sharp } },
    },
  });

export const fastfetch: Target = {
  name: "fastfetch",
  files: ({ colors }) => [{ path: "themes/fastfetch/hush.jsonc", content: theme(colors) }],
};
