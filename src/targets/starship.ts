import { type Palette, slots } from "../palette.ts";
import type { Target } from "../target.ts";
import { lines } from "../text.ts";

const hues = ["black", "red", "green", "yellow", "blue", "purple", "cyan", "white"];
const names = [...hues, ...hues.map((hue) => `bright-${hue}`)];

const theme = (palette: Palette) => lines(['palette = "hush"', "", "[palettes.hush]", ...slots(palette, names).map(([name, color]) => `${name} = "${color}"`)]);

export const starship: Target = {
  name: "starship",
  files: (palette) => [{ path: "themes/starship/hush.toml", content: theme(palette) }],
};
