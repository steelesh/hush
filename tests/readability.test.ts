import { contrast } from "../src/color.ts";
import { load, type Name } from "../src/palette.ts";
import { type Floor, floors, within } from "./support.ts";

const palette = load();
const c = palette.colors;

const accents = within(palette, "accent");
const signals = within(palette, "signal");
const tints = within(palette, "tint");
const diffs = tints.filter((name) => name !== "tint_search");
const plain: Name[] = ["pitch", "still", "room", "lull"];

const on = (foregrounds: Name[], backgrounds: Name[], minimum: number): Floor[] =>
  foregrounds.flatMap((foreground) =>
    backgrounds.map((background) => ({
      pair: `${foreground} on ${background}`,
      detail: `${c[foreground]} on ${c[background]}`,
      measured: contrast(c[foreground], c[background]),
      minimum,
    })),
  );

floors(
  "contrast",
  {
    "main text and every accent on the page": on(["voice", ...accents], ["pitch", "still"], 7),
    "keywords, punctuation and signals on every plain surface": on(["rest", "murmur", ...signals], plain, 4.5),
    "comments on every plain surface": on(["whisper"], plain, 4.5),
    "dim text on the page": on(["breath"], ["pitch", "still"], 4.5),
    "main text on tints, the current item and selection": on(["voice"], [...tints, "near", "held"], 7),
    "text drawn on the accent and on the cursor": on(["pitch"], ["call", "caret"], 7),
    "borders against the page": on(["trace"], ["pitch"], 3),
    "dim text in floats and on the cursor line": on(["breath"], ["room", "lull"], 4.5),
    "matched characters and secondary text on the current item": on(["call", "murmur", "whisper"], ["near"], 4.5),
    "selected code keeps its own color": [...on(accents, ["held"], 4.5), ...on(["murmur", "whisper", ...signals], ["held"], 3)],
    "code and comments on diff lines": on([...accents, "murmur", "whisper"], diffs, 4.5),
  },
  {},
);
