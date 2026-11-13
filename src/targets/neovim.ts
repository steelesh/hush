import { names } from "../palette.ts";
import type { Target } from "../target.ts";
import { lines } from "../text.ts";

export const neovim: Target = {
  name: "neovim",
  files: ({ colors, ansi }) => [
    {
      path: "lua/hush/palette.lua",
      content: lines([
        "return {",
        "  colors = {",
        ...names.map((name) => `    ${name} = "${colors[name]}",`),
        "  },",
        "  ansi = {",
        ...ansi.map((name) => `    "${name}",`),
        "  },",
        "}",
      ]),
    },
  ],
};
