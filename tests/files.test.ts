import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import { load } from "../src/palette.ts";
import { targets } from "../src/targets/index.ts";
import { variants } from "../src/variant.ts";
import { files, read, report, root } from "./support.ts";

const palette = load();
const values = new Set(Object.values(palette.colors));
const titles = variants(palette)
  .map((variant) => variant.name)
  .sort((a, b) => b.length - a.length);

const built = new Set(targets.flatMap((target) => target.files(palette)).map((file) => file.path));
const generated = [...new Set([...files("themes"), ...built])].filter((path) => !path.endsWith(".tsv")).sort();
const handwritten = [...files("lua"), ...files("colors"), ...files("src")].filter((path) => !built.has(path));

const named = [
  "aqua aquamarine azure beige bisque black blue brown chartreuse chocolate coral crimson cyan fuchsia gold goldenrod gray green grey indigo ivory khaki",
  "lavender lime linen magenta maroon navy olive orange orchid peru pink plum purple red salmon sienna silver snow tan teal thistle tomato turquoise violet",
  "wheat white yellow",
]
  .join(" ")
  .replaceAll(" ", "|");

const notations: [pattern: RegExp, value: (match: RegExpMatchArray) => string][] = [
  [/#([0-9a-f]{6})(?:[0-9a-f]{2})?(?![0-9a-f])/gi, (match) => `#${match[1]}`],
  [/#[0-9a-f]{3,5}(?![0-9a-f])/gi, (match) => match[0]],
  [/\b0x(?:[0-9a-f]{2})?([0-9a-f]{6})(?![0-9a-f])/gi, (match) => `#${match[1]}`],
  [/(?<![\w#.-])([0-9a-f]{6})(?![\w.-])/gi, (match) => `#${match[1]}`],
  [/\brgb:([0-9a-f]{2})\/([0-9a-f]{2})\/([0-9a-f]{2})\b/gi, (match) => `#${match[1]}${match[2]}${match[3]}`],
  [/\b[34]8[;:]2[;:](\d{1,3})[;:](\d{1,3})[;:](\d{1,3})(?!\d)/g, (match) => triple(match)],
  [/\b[34]8[;:]5[;:]\d{1,3}(?!\d)/g, (match) => match[0]],
  [/(?<![\w.#-])(\d{1,3})(?:\s*,\s*|\s+)(\d{1,3})(?:\s*,\s*|\s+)(\d{1,3})(?![\w.%-]|\s*,)/g, (match) => triple(match)],
  [/\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|color-mix)\([^)]*\)/gi, (match) => match[0]],
  [/(?<![\w.])colou?r\d{1,3}\b/gi, (match) => match[0]],
  [/\b(?:fg|bg|hl|color|colour|foreground|background)\+?\s*[:=]\s*["']?(\d{1,3})(?![\w#])/gi, (match) => `ansi ${match[1]}`],
  [new RegExp(`(?<![\\w.-])(?:bright|light|dark)?(?:${named})(?![\\w.-]|["']?\\s*(?::|=(?!=)))`, "gi"), (match) => match[0]],
];

const italicOff = [/italics?["']?\s*[:=]\s*["']?(false|no|off|none|0)\b/i, /\bno[\s_-]?italics?\b/i, /font-style\s*:\s*normal/i];
const italicCode = new RegExp(`(?:\\\\e|\\\\033|\\\\x1b|\\\\u001b|${String.fromCharCode(27)})\\[(?:\\d+;)*3(?:;\\d+)*m`, "i");

function triple(match: RegExpMatchArray): string {
  const parts = [match[1], match[2], match[3]].map(Number);
  if (parts.some((part) => part > 255)) return "";
  return `#${parts.map((part) => part.toString(16).padStart(2, "0")).join("")}`;
}

function colorsIn(text: string): string[] {
  return notations.flatMap(([pattern, value]) => [...text.matchAll(pattern)].map((match) => value(match).toLowerCase())).filter((value) => value !== "");
}

test("every color in a generated file, in any notation, is a palette color", () => {
  const failures: string[] = [];
  for (const path of generated) {
    const source = path.endsWith(".svg") ? read(path).replace(/\b(?:d|viewBox|points|transform)="[^"]*"/g, "") : read(path);
    const text = titles.reduce((rest, title) => rest.replaceAll(title, ""), source);
    for (const value of new Set(colorsIn(text))) {
      if (!values.has(value)) failures.push(`${path}: ${value} is not a palette color`);
    }
  }
  assert.ok(generated.length > 0 && built.size > 0, "no generated files were found");
  assert.equal(failures.length, 0, report(failures));
});

test("no hand-written source file contains a color literal", () => {
  const failures: string[] = [];
  for (const path of handwritten) {
    read(path)
      .split("\n")
      .forEach((line, index) => {
        const literal = line.match(/#[0-9a-f]{6}\b|\b0x[0-9a-f]{6,8}\b/i);
        if (literal) failures.push(`${path}:${index + 1}: ${literal[0]} belongs in palette.json`);
      });
  }
  assert.ok(handwritten.length > 0, "no hand-written source files were found");
  assert.equal(failures.length, 0, report(failures));
});

test("no generated file asks for an italic or oblique style", () => {
  const failures: string[] = [];
  for (const path of generated) {
    read(path)
      .split("\n")
      .forEach((line, index) => {
        const asks = /italic|oblique/i.test(line.replace(/markup\.italic|MARKDOWN_ITALIC/g, "")) && !italicOff.some((pattern) => pattern.test(line));
        if (asks || italicCode.test(line)) failures.push(`${path}:${index + 1}: "${line.trim()}" asks for a slanted style`);
      });
  }
  assert.equal(failures.length, 0, report(failures));
});

test("the committed generated files are exactly what the build writes", () => {
  const result = spawnSync(process.execPath, ["src/build.ts", "--check"], { cwd: root, encoding: "utf8" });
  assert.equal(result.status, 0, `node src/build.ts --check exited with ${result.status}\n${result.stdout}${result.stderr}`);
});

test("the build names an option or target it does not know and stops", () => {
  const mistakes: [argument: string, message: string][] = [
    ["--chek", "build: unknown option --chek, the only option is --check"],
    ["vscod", "build: unknown target vscod, expected one of: "],
  ];
  for (const [argument, message] of mistakes) {
    const result = spawnSync(process.execPath, ["src/build.ts", argument], { cwd: root, encoding: "utf8" });
    assert.equal(result.status, 1);
    assert.ok(result.stderr.startsWith(message), result.stderr);
  }
});
