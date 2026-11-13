import { readFileSync } from "node:fs";

export const names = [
  "voice",
  "murmur",
  "whisper",
  "breath",
  "trace",
  "call",
  "said",
  "form",
  "rest",
  "aside",
  "sharp",
  "flat",
  "cue",
  "nudge",
  "grown",
  "pitch",
  "still",
  "room",
  "lull",
  "near",
  "held",
  "tint_add",
  "tint_add_strong",
  "tint_change",
  "tint_delete",
  "tint_delete_strong",
  "tint_search",
  "caret",
] as const;

const groups = ["text", "accent", "signal", "surface", "tint", "cursor"] as const;

export type Name = (typeof names)[number];
export type Group = (typeof groups)[number];
export type Colors = Readonly<Record<Name, string>>;
export type Palette = {
  colors: Colors;
  groups: Readonly<Record<Name, Group>>;
  ansi: readonly Name[];
};

const file = new URL("../palette.json", import.meta.url);

const isName = (value: unknown): value is Name => names.includes(value as Name);
const isGroup = (value: unknown): value is Group => groups.includes(value as Group);

function fail(problem: string): never {
  throw new Error(`palette.json: ${problem}`);
}

function record(value: unknown, where: string, keys: readonly string[]): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) fail(`${where} must be an object`);
  const found = value as Record<string, unknown>;
  for (const key of keys) if (!Object.hasOwn(found, key)) fail(`${where} is missing "${key}"`);
  for (const key of Object.keys(found)) if (!keys.includes(key)) fail(`${where} has an unknown key "${key}"`);
  return found;
}

export function parse(source: unknown): Palette {
  const top = record(source, "the file", ["colors", "ansi"]);
  const entries = record(top.colors, "colors", names);
  const colors = {} as Record<Name, string>;
  const placed = {} as Record<Name, Group>;
  for (const name of names) {
    const where = `color "${name}"`;
    const { hex, group, use } = record(entries[name], where, ["hex", "group", "use"]);
    if (typeof hex !== "string" || !/^#[0-9a-f]{6}$/.test(hex)) fail(`${where} has hex ${JSON.stringify(hex)}, expected a lowercase #rrggbb string`);
    if (!isGroup(group)) fail(`${where} has group ${JSON.stringify(group)}, expected one of ${groups.join(", ")}`);
    if (typeof use !== "string" || use.trim() === "" || use !== use.toLowerCase()) fail(`${where} has use ${JSON.stringify(use)}, expected lowercase prose`);
    colors[name] = hex;
    placed[name] = group;
  }
  if (!Array.isArray(top.ansi) || top.ansi.length !== 16) fail("ansi must be an array of 16 color names");
  const ansi = top.ansi.map((name: unknown, slot) => (isName(name) ? name : fail(`ansi slot ${slot} is ${JSON.stringify(name)}, expected a color name`)));
  return { colors, groups: placed, ansi };
}

export function slots<Label>({ colors, ansi }: Palette, labels: readonly Label[]): [label: Label, color: string][] {
  if (labels.length !== ansi.length) throw new Error(`${labels.length} labels for ${ansi.length} terminal colors`);
  return ansi.map((name, slot) => [labels[slot] as Label, colors[name]]);
}

export function load(): Palette {
  let source: unknown;
  try {
    source = JSON.parse(readFileSync(file, "utf8"));
  } catch (cause) {
    fail(`cannot be read as json: ${cause instanceof Error ? cause.message : cause}`);
  }
  return parse(source);
}
