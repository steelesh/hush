import assert from "node:assert/strict";
import { test } from "node:test";
import { load } from "../src/palette.ts";
import { syntax } from "../src/syntax.ts";
import { bat } from "../src/targets/bat.ts";
import { vscode } from "../src/targets/vscode.ts";
import { report } from "./support.ts";

type Settings = { foreground: string; fontStyle?: string };
type Theme = { tokenColors: { name: string; scope: string[]; settings: Settings }[]; semanticTokenColors: Record<string, Settings> };

const palette = load();
const c = palette.colors;

const roles: Record<string, string> = {
  comment: "whisper",
  string: "said",
  regexp: "said",
  number: "said",
  literal: "said",
  constant: "call",
  escape: "rest",
  interpolation: "voice",
  keyword: "rest",
  label: "rest",
  operator: "murmur",
  function: "call",
  type: "form",
  property: "form",
  tag: "form",
  parameter: "aside",
  attribute: "aside",
  variable: "voice",
  module: "voice",
  punctuation: "murmur",
  annotation: "murmur",
  heading: "aside bold",
  bold: "voice bold",
  emphasis: "voice underline",
  underline: "voice underline",
  raw: "said",
  "raw block": "voice",
  link: "aside",
  "link address": "aside underline",
  quote: "whisper",
  list: "murmur",
  inserted: "grown",
  deleted: "sharp",
  changed: "flat",
  "diff range": "murmur",
  invalid: "sharp",
  "log info": "cue",
  "log debug": "nudge",
  "log warning": "flat",
  "log error": "sharp",
};

const tokenTypes = [
  "namespace class enum interface struct typeParameter type parameter variable property enumMember decorator event function method macro label",
  "comment string keyword number regexp operator",
  "boolean builtinAttribute builtinType escapeSequence formatSpecifier selfKeyword typeAlias",
  "annotation modifier record",
  "clsParameter module selfParameter",
]
  .join(" ")
  .split(" ");

const tokenModifiers = "declaration definition readonly static deprecated abstract async modification documentation defaultLibrary".split(" ");

const output = (target: typeof vscode, path: string) => target.files(palette).find((file) => file.path === path)?.content ?? "";
const theme = JSON.parse(output(vscode, "themes/vscode/themes/hush-color-theme.json")) as Theme;
const tmTheme = output(bat, "themes/bat/hush.tmTheme");

const drawn = (color: string, style?: string) => {
  const name = Object.entries(c).find(([, value]) => value === color)?.[0] ?? color;
  return style ? `${name} ${style}` : name;
};

const mismatches = (found: Map<string, string>) =>
  [...new Set([...Object.keys(roles), ...found.keys()])]
    .filter((role) => found.get(role) !== roles[role])
    .map((role) => `${role}: drawn as ${found.get(role) ?? "nothing"}, expected ${roles[role] ?? "no such role"}`);

test("every syntax role has the color and style recorded here", () => {
  assert.deepEqual(Object.fromEntries(syntax.map(({ name, color, style }) => [name, style ? `${color} ${style}` : color])), roles);
});

test("the vs code theme draws every role in its recorded color", () => {
  const found = new Map(theme.tokenColors.map(({ name, settings }) => [name, drawn(settings.foreground, settings.fontStyle)]));
  const failures = mismatches(found);
  for (const { name, scopes, semantic = [] } of syntax) {
    const token = theme.tokenColors.find((entry) => entry.name === name);
    if (token?.scope.join() !== scopes.join()) failures.push(`${name}: scopes are ${token?.scope.join()}, expected ${scopes.join()}`);
    for (const selector of semantic) {
      const settings = theme.semanticTokenColors[selector];
      const got = settings ? drawn(settings.foreground, settings.fontStyle) : "nothing";
      if (got !== roles[name]) failures.push(`${name}: semantic token ${selector} is drawn as ${got}, expected ${roles[name]}`);
    }
  }
  const selectors = syntax.flatMap(({ semantic = [] }) => semantic);
  assert.deepEqual(Object.keys(theme.semanticTokenColors), selectors);
  assert.equal(failures.length, 0, report(failures));
});

test("the bat theme draws every role in its recorded color", () => {
  const rule =
    /<key>name<\/key>\s*<string>([^<]*)<\/string>\s*<key>scope<\/key>\s*<string>([^<]*)<\/string>\s*<key>settings<\/key>\s*<dict>\s*<key>foreground<\/key>\s*<string>([^<]*)<\/string>(?:\s*<key>fontStyle<\/key>\s*<string>([^<]*)<\/string>)?\s*<\/dict>/g;
  const rules = [...tmTheme.matchAll(rule)];
  const failures = mismatches(new Map(rules.map(([, name = "", , color = "", style]) => [name, drawn(color, style)])));
  for (const { name, scopes } of syntax) {
    const found = rules.find((entry) => entry[1] === name)?.[2];
    if (found !== scopes.join(", ")) failures.push(`${name}: scopes are ${found}, expected ${scopes.join(", ")}`);
  }
  assert.equal(failures.length, 0, report(failures));
});

test("no scope is listed twice, malformed, or already covered by a broader scope of its own role", () => {
  const owner = new Map<string, string>();
  const failures: string[] = [];
  for (const { name, scopes } of syntax) {
    if (scopes.length === 0) failures.push(`${name}: no scopes`);
    for (const scope of scopes) {
      if (!/^[a-z][a-z_-]*(\.[a-z_-]+)*( [a-z][a-z_-]*(\.[a-z_-]+)*)*$/.test(scope)) failures.push(`${name}: "${scope}" is not a scope selector`);
      if (owner.has(scope)) failures.push(`${scope}: listed under both ${owner.get(scope)} and ${name}`);
      owner.set(scope, name);
    }
  }
  for (const [scope, name] of owner) {
    if (scope.includes(" ")) continue;
    const parts = scope.split(".");
    for (let length = parts.length - 1; length > 0; length -= 1) {
      const broader = parts.slice(0, length).join(".");
      if (!owner.has(broader)) continue;
      if (owner.get(broader) === name) failures.push(`${scope}: already covered by ${broader} in ${name}`);
      break;
    }
  }
  assert.equal(failures.length, 0, report(failures));
});

test("every semantic selector names a token type and modifiers that language servers send", () => {
  const seen = new Set<string>();
  const failures: string[] = [];
  for (const { name, semantic = [] } of syntax) {
    for (const selector of semantic) {
      const [type = "", ...modifiers] = selector.split(".");
      if (seen.has(selector)) failures.push(`${name}: ${selector} is listed twice`);
      seen.add(selector);
      if (!tokenTypes.includes(type)) failures.push(`${name}: ${selector} has unknown token type ${type}`);
      for (const modifier of modifiers) {
        if (!tokenModifiers.includes(modifier)) failures.push(`${name}: ${selector} has unknown modifier ${modifier}`);
      }
    }
  }
  assert.equal(
    failures.length,
    0,
    `${report(failures)}\nstandard types and modifiers are from https://code.visualstudio.com/api/language-extensions/semantic-highlight-guide as approved 2026-11-11; the other types are sent by rust-analyzer, the java language server and pylance`,
  );
});
