import assert from "node:assert/strict";
import { test } from "node:test";
import { luminance } from "../src/color.ts";
import { load, type Name, names, parse, slots } from "../src/palette.ts";
import { read, report } from "./support.ts";

type Entry = Record<string, unknown>;
type Source = { colors: { voice: Entry } & Record<string, Entry>; ansi: unknown[] } & Record<string, unknown>;

const palette = load();
const c = palette.colors;

const source = () => JSON.parse(read("palette.json")) as Source;

const ansi: Name[] = ["lull", "sharp", "grown", "said", "cue", "aside", "form", "voice", "whisper", "sharp", "grown", "said", "cue", "aside", "form", "voice"];

const tiers: Name[][] = [["voice"], ["call", "said", "form", "aside"], ["rest"], ["murmur"], ["whisper"], ["breath"], ["trace"]];

const surfaces: Name[] = ["pitch", "still", "room", "lull", "near", "held"];

const malformed: [problem: string, message: RegExp, change: (source: Source) => unknown][] = [
  ["a file that is not an object", /the file must be an object/, () => []],
  ["a missing colors key", /the file is missing "colors"/, ({ ansi }) => ({ ansi })],
  ["a missing ansi key", /the file is missing "ansi"/, ({ colors }) => ({ colors })],
  ["an extra top level key", /the file has an unknown key "version"/, (source) => ({ ...source, version: "1.0.0" })],
  ["a missing color", /colors is missing "voice"/, ({ colors: { voice: _, ...colors }, ansi }) => ({ colors, ansi })],
  ["a renamed color", /colors is missing "call"/, (source) => Object.assign(source, { colors: rename(source.colors, "call", "accent") })],
  ["an extra color", /colors has an unknown key "shout"/, (source) => Object.assign(source.colors, { shout: source.colors.voice }) && source],
  ["a color that is not an object", /color "voice" must be an object/, (source) => Object.assign(source.colors, { voice: "#dcdae7" }) && source],
  ["a color without a hex", /color "voice" is missing "hex"/, (source) => delete source.colors.voice.hex && source],
  ["a color with an extra key", /color "voice" has an unknown key "alpha"/, (source) => Object.assign(source.colors.voice, { alpha: 1 }) && source],
  ["an uppercase hex", /color "voice" has hex "#DCDAE7", expected a lowercase #rrggbb string/, (source) => set(source, "hex", "#DCDAE7")],
  ["a three digit hex", /color "voice" has hex "#ddd"/, (source) => set(source, "hex", "#ddd")],
  ["a hex with an alpha", /color "voice" has hex "#dcdae7ff"/, (source) => set(source, "hex", "#dcdae7ff")],
  ["a hex that is a number", /color "voice" has hex 14473959/, (source) => set(source, "hex", 0xdcdae7)],
  ["an unknown group", /color "voice" has group "loud", expected one of text, accent/, (source) => set(source, "group", "loud")],
  ["an empty use", /color "voice" has use "", expected lowercase prose/, (source) => set(source, "use", "")],
  ["a use that is not lowercase", /color "voice" has use "Main text"/, (source) => set(source, "use", "Main text")],
  ["an ansi list that is not an array", /ansi must be an array of 16 color names/, (source) => Object.assign(source, { ansi: "lull" })],
  ["an ansi list of 15", /ansi must be an array of 16 color names/, (source) => Object.assign(source, { ansi: source.ansi.slice(1) })],
  ["an ansi slot naming no color", /ansi slot 3 is "amber", expected a color name/, (source) => Object.assign(source.ansi, { 3: "amber" }) && source],
  ["an ansi slot holding a hex", /ansi slot 0 is "#1f1f1f"/, (source) => Object.assign(source.ansi, { 0: "#1f1f1f" }) && source],
];

function rename(colors: Source["colors"], from: string, to: string) {
  return Object.fromEntries(Object.entries(colors).map(([name, entry]) => [name === from ? to : name, entry]));
}

function set(source: Source, key: string, value: unknown) {
  source.colors.voice[key] = value;
  return source;
}

const lum = (name: Name) => `${name} ${luminance(c[name]).toFixed(4)}`;

const neighbors = <T>(list: readonly T[]): [T, T][] => list.flatMap((item, index) => list.slice(index + 1, index + 2).map((next): [T, T] => [item, next]));

test("palette.json parses to every known name with its hex value", () => {
  const written = source();
  assert.deepEqual(Object.keys(written.colors), [...names]);
  assert.deepEqual(parse(written), palette);
  for (const name of names) assert.equal(c[name], written.colors[name]?.hex);
});

for (const [problem, message, change] of malformed) {
  test(`the palette rejects ${problem}`, () => {
    assert.throws(
      () => parse(change(source())),
      (error: Error) => error.message.startsWith("palette.json: ") && message.test(error.message),
    );
  });
}

test("no two names share a value", () => {
  const byValue = new Map<string, Name[]>();
  for (const name of names) byValue.set(c[name], [...(byValue.get(c[name]) ?? []), name]);
  const failures = [...byValue].filter(([, sharing]) => sharing.length > 1).map(([value, sharing]) => `${sharing.join(", ")}: all are ${value}`);
  assert.equal(failures.length, 0, report(failures));
});

test("the 16 terminal slots name the expected colors", () => {
  const terminal = palette.ansi;
  assert.deepEqual([...terminal], ansi);
  const failures: string[] = [];
  for (let slot = 1; slot <= 6; slot += 1) {
    if (terminal[slot + 8] !== terminal[slot]) failures.push(`ansi slot ${slot + 8}: is ${terminal[slot + 8]}, must repeat slot ${slot} ${terminal[slot]}`);
    for (let other = slot + 1; other <= 6; other += 1) {
      if (terminal[slot] === terminal[other]) failures.push(`ansi slots ${slot} and ${other}: both are ${terminal[slot]}`);
    }
  }
  for (const reserved of ["call", "caret"] as Name[]) {
    if (terminal.includes(reserved)) failures.push(`ansi slot ${terminal.indexOf(reserved)}: ${reserved} is reserved for the cursor and the current thing`);
  }
  assert.equal(failures.length, 0, report(failures));
});

test("slots pairs one label with each terminal color and rejects any other count", () => {
  const labels = palette.ansi.map((_, slot) => `slot ${slot}`);
  assert.deepEqual(
    slots(palette, labels),
    palette.ansi.map((name, slot) => [`slot ${slot}`, c[name]]),
  );
  assert.throws(() => slots(palette, labels.slice(1)), /15 labels for 16 terminal colors/);
});

test("brightness falls from voice through the accents, rest, murmur, whisper and breath to trace", () => {
  const failures: string[] = [];
  for (const [louderTier, quieterTier] of neighbors(tiers)) {
    for (const louder of louderTier) {
      for (const quieter of quieterTier) {
        if (luminance(c[louder]) <= luminance(c[quieter])) failures.push(`${lum(louder)} must be brighter than ${lum(quieter)}`);
      }
    }
  }
  assert.equal(failures.length, 0, report(failures));
});

test("surfaces rise from pitch through still, room, lull and near to held", () => {
  const failures: string[] = [];
  for (const [darker, lighter] of neighbors(surfaces)) {
    if (luminance(c[darker]) >= luminance(c[lighter])) failures.push(`${lum(darker)} must be darker than ${lum(lighter)}`);
  }
  assert.equal(failures.length, 0, report(failures));
});
