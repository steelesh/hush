import type { Palette } from "./palette.ts";

export type File = { path: string; content: string };

export type Target = {
  name: string;
  files: (palette: Palette) => File[];
};
