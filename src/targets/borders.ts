import { argb } from "../color.ts";
import type { Colors } from "../palette.ts";
import type { Target } from "../target.ts";

const theme = (c: Colors) => `active_color=${argb(c.murmur)}
inactive_color=${argb(c.trace)}
`;

export const borders: Target = {
  name: "borders",
  files: ({ colors }) => [{ path: "themes/borders/sotto.sh", content: theme(colors) }],
};
