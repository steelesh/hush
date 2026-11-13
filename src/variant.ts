import type { Palette } from "./palette.ts";

export type Variant = { name: string; file: string; palette: Palette };

const paged = (palette: Palette, page: string): Palette => ({ ...palette, colors: { ...palette.colors, pitch: page, still: page } });

export const variants = (palette: Palette): Variant[] => [
  { name: "Sotto", file: "sotto", palette: paged(palette, palette.colors.still) },
  { name: "Sotto Black", file: "sotto-black", palette: paged(palette, palette.colors.pitch) },
];
