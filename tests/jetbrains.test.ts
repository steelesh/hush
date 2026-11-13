import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import meta from "../package.json" with { type: "json" };
import { load } from "../src/palette.ts";
import { syntax } from "../src/syntax.ts";
import { folderIcons } from "../src/targets/jetbrains/icons.ts";
import { jetbrains } from "../src/targets/jetbrains/index.ts";
import { read, report, root } from "./support.ts";

const role = (name: string) => {
  const found = syntax.find((entry) => entry.name === name);
  if (!found) throw new Error(`no syntax role named ${name}`);
  return found;
};

type Node = { name: string; attributes: Record<string, string>; children: Node[]; text: string };
type Reference = {
  source: string;
  build: string;
  fetched: string;
  ui: string[];
  inherited: string[];
  defaults: string[];
  attributes: string[];
  colors: string[];
};
type Theme = {
  name: string;
  dark: boolean;
  author: string;
  parentTheme: string;
  editorScheme: string;
  colors: Record<string, string>;
  ui: Record<string, unknown>;
  icons: { ColorPalette: Record<string, string> };
};

const entities: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };

function decode(text: string, where: string): string {
  if (text.includes("<")) throw new Error(`${where}: a raw < in text`);
  return text.replace(/&([^;]*);?/g, (whole, name: string) => {
    const character = entities[name];
    if (!whole.endsWith(";") || character === undefined) throw new Error(`${where}: "${whole}" is not an escaped character`);
    return character;
  });
}

function parse(source: string, where: string): Node {
  const top: Node = { name: "", attributes: {}, children: [], text: "" };
  const open = [top];
  const tag = /<(\/?)([A-Za-z_][\w.-]*)((?:\s+[A-Za-z_][\w.:-]*="[^"]*")*)\s*(\/?)>/y;
  let at = 0;
  while (at < source.length) {
    const next = source.indexOf("<", at);
    const here = open.at(-1) ?? top;
    here.text += decode(source.slice(at, next < 0 ? source.length : next), where);
    if (next < 0) break;
    tag.lastIndex = next;
    const found = tag.exec(source);
    if (!found) throw new Error(`${where}: malformed markup at offset ${next}: ${source.slice(next, next + 40)}`);
    const [whole, closing, name = "", attributes = "", empty] = found;
    at = next + whole.length;
    if (closing) {
      if (attributes || empty || here.name !== name || open.length === 1) throw new Error(`${where}: </${name}> does not close <${here.name}>`);
      open.pop();
      continue;
    }
    const node: Node = { name, attributes: {}, children: [], text: "" };
    for (const [, key = "", value = ""] of attributes.matchAll(/([A-Za-z_][\w.:-]*)="([^"]*)"/g)) {
      if (key in node.attributes) throw new Error(`${where}: <${name}> repeats ${key}`);
      node.attributes[key] = decode(value, where);
    }
    here.children.push(node);
    if (!empty) open.push(node);
  }
  if (open.length !== 1) throw new Error(`${where}: <${open.at(-1)?.name}> is never closed`);
  const [root, ...others] = top.children;
  if (!root || others.length > 0 || top.text.trim() !== "") throw new Error(`${where}: expected exactly one root element`);
  return root;
}

const palette = load();
const values = new Set(Object.values(palette.colors));
const output = new Map(jetbrains.files(palette).map((file) => [file.path, file.content]));
const file = (path: string) => output.get(`themes/jetbrains/${path}`) ?? "";
const reference = JSON.parse(read("tests/jetbrains-keys.json")) as Reference;
const origin = `the key lists in tests/jetbrains-keys.json were read from ${reference.source}, build ${reference.build}, on ${reference.fetched}`;

const plugin = parse(file("META-INF/plugin.xml"), "plugin.xml");
const scheme = parse(file("sotto.xml"), "sotto.xml");
const theme = JSON.parse(file("sotto.theme.json")) as Theme;

const child = (node: Node, name: string) => node.children.filter((entry) => entry.name === name);
const only = (node: Node, name: string) => {
  const [found, ...others] = child(node, name);
  assert.ok(found && others.length === 0, `expected one <${name}> in <${node.name}>, found ${found ? others.length + 1 : 0}`);
  return found;
};

const options = (node: Node) => child(node, "option").map((entry): [string, Node] => [entry.attributes.name ?? "", entry]);
const colors = new Map(options(only(scheme, "colors")).map(([name, entry]) => [name, entry.attributes.value ?? ""]));
const attributes = new Map(
  options(only(scheme, "attributes")).map(([name, entry]) => [
    name,
    new Map(options(only(entry, "value")).map(([part, option]) => [part, option.attributes.value ?? ""])),
  ]),
);

function flatten(sheet: Record<string, unknown>, prefix = ""): [string, unknown][] {
  return Object.entries(sheet).flatMap(([key, value]): [string, unknown][] =>
    value !== null && typeof value === "object" ? flatten(value as Record<string, unknown>, `${prefix}${key}.`) : [[`${prefix}${key}`, value]],
  );
}

const ui = new Map(flatten(theme.ui));
const patterns = [...ui.keys()].filter((key) => key.startsWith("*.")).map((key) => key.slice(1));
const transparent = ["StatusBar.borderColor", "ToolWindow.Stripe.borderColor", "MainToolbar.borderColor"];

const left = [
  "ProgressBar.failedcolor",
  "ProgressBar.failedendcolor",
  "ProgressBar.indeterminateendcolor",
  "ProgressBar.passedcolor",
  "ProgressBar.passedendcolor",
];

const consoleSlots = [
  "BLACK",
  "RED",
  "GREEN",
  "YELLOW",
  "BLUE",
  "MAGENTA",
  "CYAN",
  "GRAY",
  "DARKGRAY",
  "RED_BRIGHT",
  "GREEN_BRIGHT",
  "YELLOW_BRIGHT",
  "BLUE_BRIGHT",
  "MAGENTA_BRIGHT",
  "CYAN_BRIGHT",
  "WHITE",
];
const terminalSlots = ["BLACK", "RED", "GREEN", "YELLOW", "BLUE", "MAGENTA", "CYAN", "WHITE"];

const pairs: [name: string, key: string, group: string][] = [
  ["comment", "DEFAULT_LINE_COMMENT", "@comment"],
  ["keyword", "DEFAULT_KEYWORD", "@keyword"],
  ["function", "DEFAULT_FUNCTION_DECLARATION", "@function"],
  ["string", "DEFAULT_STRING", "@string"],
  ["type", "DEFAULT_CLASS_NAME", "@type"],
  ["parameter", "DEFAULT_PARAMETER", "@variable.parameter"],
  ["annotation", "DEFAULT_METADATA", "@attribute"],
];

const foreground = (key: string) => {
  const value = attributes.get(key)?.get("FOREGROUND");
  return value === undefined ? undefined : `#${value}`;
};

test("the target writes the license, the descriptor, the icon and a theme and scheme for each variant", () => {
  assert.deepEqual(
    [...output.keys()].sort(),
    [
      "themes/jetbrains/LICENSE",
      "themes/jetbrains/META-INF/plugin.xml",
      "themes/jetbrains/META-INF/pluginIcon.svg",
      "themes/jetbrains/sotto-black.theme.json",
      "themes/jetbrains/sotto-black.xml",
      "themes/jetbrains/sotto.theme.json",
      "themes/jetbrains/sotto.xml",
      ...folderIcons(palette.colors).map((file) => file.path),
    ].sort(),
  );
});

test("the plugin descriptor names one theme and nothing that runs", () => {
  assert.equal(plugin.name, "idea-plugin");
  assert.equal(only(plugin, "id").text, "dev.steelesh.sotto");
  assert.equal(only(plugin, "name").text, "Sotto");
  assert.equal(only(plugin, "version").text, meta.version);
  assert.equal(only(plugin, "vendor").text, "steelesh");
  assert.ok(only(plugin, "description").text.length >= 40, "the description is shorter than the marketplace minimum");
  const version = only(plugin, "idea-version").attributes;
  const since = version["since-build"] ?? "";
  assert.match(since, /^\d{3}(\.\d+)*$/);
  assert.ok(Number(since.slice(0, 3)) >= 261, "since-build is older than 2026.1");
  assert.equal(version["until-build"], undefined);
  assert.deepEqual(
    child(plugin, "depends").map((entry) => entry.text),
    ["com.intellij.modules.platform"],
  );
  const extensions = only(plugin, "extensions");
  assert.equal(extensions.attributes.defaultExtensionNs, "com.intellij");
  assert.deepEqual(
    extensions.children.map((entry) => [entry.name, entry.attributes]),
    [
      ["themeProvider", { id: "dev.steelesh.sotto", path: "/sotto.theme.json" }],
      ["themeProvider", { id: "dev.steelesh.sotto.black", path: "/sotto-black.theme.json" }],
    ],
  );
  for (const provider of extensions.children) {
    assert.ok(output.has(`themes/jetbrains${provider.attributes.path}`), "the descriptor points at a file the target does not write");
  }
});

test("the theme is dark, has the required keys and points at the editor scheme", () => {
  assert.equal(theme.name, "Sotto");
  const black = JSON.parse(file("sotto-black.theme.json")) as Theme;
  assert.equal(black.name, "Sotto Black");
  assert.equal(black.editorScheme, "/sotto-black.xml");
  assert.equal(black.colors.still, palette.colors.pitch);
  assert.equal(black.colors.pitch, palette.colors.pitch);
  assert.deepEqual(
    flatten(black.ui).map(([key]) => key),
    [...ui.keys()],
  );
  assert.equal(parse(file("sotto-black.xml"), "sotto-black.xml").attributes.name, "Sotto Black");
  assert.equal(theme.dark, true);
  assert.equal(theme.author, "steelesh");
  assert.equal(typeof theme.parentTheme, "string");
  assert.ok(output.has(`themes/jetbrains${theme.editorScheme}`), "editorScheme points at a file the target does not write");
  assert.equal(scheme.name, "scheme");
  assert.equal(scheme.attributes.name, theme.name);
  assert.equal(scheme.attributes.version, "142");
  assert.equal(typeof scheme.attributes.parent_scheme, "string");
  assert.ok(ui.size > 0 && colors.size > 0 && attributes.size > 0);
});

test("the named colors are the palette, and every interface value is one of them", () => {
  assert.deepEqual(theme.colors, { ...palette.colors, pitch: palette.colors.still });
  const failures: string[] = [];
  const literal = /^(?:\d+,\d+,\d+,\d+,)?(#[0-9a-f]{6})([0-9a-f]{2})?$/;
  const judge = (label: string, value: unknown) => {
    if (typeof value === "number") return;
    if (typeof value !== "string") failures.push(`${label}: ${JSON.stringify(value)} is not a color, a name or a number`);
    else if (!(value in theme.colors || values.has(value.match(literal)?.[1] ?? ""))) failures.push(`${label}: ${value} is not a palette color`);
  };
  for (const [key, value] of ui) judge(key, value);
  for (const [key, value] of Object.entries(theme.icons.ColorPalette)) {
    if (!/^#[0-9a-f]{6}$/.test(value) || !values.has(value)) failures.push(`icons ${key}: ${value} is not a palette color`);
  }
  assert.equal(failures.length, 0, report(failures));
});

test("every interface key is one the platform knows", () => {
  const known = new Set(reference.ui);
  const failures = [...ui.keys()]
    .filter((key) => !known.has(key) && !(key.startsWith("*.") && reference.ui.some((entry) => entry.endsWith(key.slice(1)))))
    .map((key) => `${key} is not a known interface key`);
  assert.equal(failures.length, 0, `${report(failures)}\n${origin}`);
});

test("every color the parent theme sets is set here, by name or by pattern", () => {
  const uncovered = reference.inherited.filter((key) => !ui.has(key) && !patterns.some((tail) => key.endsWith(tail)));
  assert.deepEqual(uncovered, left, `${origin}\nthe keys excused in this test are misspelled in the parent and read by nothing`);
});

test("the editor and the frame are the page color, the panels beside the editor are one step lighter with no outline, and the three borders that must not show are transparent", () => {
  assert.equal(ui.get("Island.borderColor"), "pitch");
  assert.equal(ui.get("EditorTabs.underlinedBorderColor"), ui.get("EditorTabs.underlinedTabBackground"));
  assert.equal(ui.get("MainWindow.background"), "pitch");
  assert.equal(ui.get("ToolWindow.background"), "room");
  assert.equal(ui.get("EditorTabs.background"), "pitch");
  assert.equal(ui.get("Editor.background"), "still");
  const failures = transparent.filter((key) => !/^#[0-9a-f]{6}00$/.test(String(ui.get(key)))).map((key) => `${key}: ${ui.get(key)} is not fully transparent`);
  assert.equal(failures.length, 0, report(failures));
});

test("every editor color is a bare lowercase palette color", () => {
  const failures: string[] = [];
  const judge = (label: string, value: string, empty: boolean) => {
    if (empty && value === "") return;
    if (!/^[0-9a-f]{6}([0-9a-f]{2})?$/.test(value) || !values.has(`#${value.slice(0, 6)}`)) failures.push(`${label}: "${value}" is not a bare palette color`);
  };
  for (const [key, value] of colors) judge(`color ${key}`, value, true);
  for (const [key, parts] of attributes) {
    for (const [part, value] of parts) {
      if (["FOREGROUND", "BACKGROUND", "EFFECT_COLOR", "ERROR_STRIPE_COLOR"].includes(part)) judge(`${key} ${part}`, value, false);
      else if (part === "EFFECT_TYPE") assert.match(value, /^[0-5]$/, `${key}: effect type ${value}`);
      else if (part !== "FONT_TYPE") failures.push(`${key}: unknown option ${part}`);
    }
    if (parts.has("EFFECT_TYPE") !== parts.has("EFFECT_COLOR")) failures.push(`${key}: an effect needs both a color and a type`);
  }
  assert.equal(failures.length, 0, report(failures));
});

test("no attribute uses a slanted font type", () => {
  const failures = [...attributes]
    .filter(([, parts]) => parts.has("FONT_TYPE") && parts.get("FONT_TYPE") !== "1")
    .map(([key, parts]) => `${key}: font type ${parts.get("FONT_TYPE")}`);
  assert.equal(failures.length, 0, report(failures));
});

test("every default attribute the platform defines is set", () => {
  const failures = reference.defaults.filter((key) => !attributes.has(key)).map((key) => `${key} is not set`);
  assert.ok(reference.defaults.length > 0 && reference.defaults.every((key) => key.startsWith("DEFAULT_")));
  assert.equal(failures.length, 0, `${report(failures)}\n${origin}`);
});

test("every attribute and color the parent scheme sets is set here", () => {
  assert.deepEqual(
    reference.attributes.filter((key) => !attributes.has(key)),
    [],
    origin,
  );
  assert.deepEqual(
    reference.colors.filter((key) => !colors.has(key)),
    [],
    origin,
  );
  assert.deepEqual([...(attributes.get("MARKDOWN_ITALIC") ?? [])].map(([part]) => part).sort(), ["EFFECT_COLOR", "EFFECT_TYPE", "FOREGROUND"]);
});

test("the page, the cursor and the selection use their palette colors", () => {
  assert.equal(foreground("TEXT"), palette.colors.voice);
  assert.equal(attributes.get("TEXT")?.get("BACKGROUND"), palette.colors.still.slice(1));
  assert.equal(colors.get("CARET_COLOR"), palette.colors.caret.slice(1));
  assert.equal(colors.get("CARET_ROW_COLOR"), "");
  assert.equal(colors.get("SELECTION_BACKGROUND"), palette.colors.held.slice(1));
  assert.equal(colors.get("CONSOLE_BACKGROUND_KEY"), palette.colors.still.slice(1));
});

test("folds have no fill or border and selections preserve syntax colors", () => {
  assert.deepEqual([...(attributes.get("FOLDED_TEXT_ATTRIBUTES") ?? [])], [["FOREGROUND", palette.colors.whisper.slice(1)]]);
  assert.equal(colors.get("FOLDED_TEXT_BORDER_COLOR"), "");
  assert.equal(colors.get("SELECTION_FOREGROUND"), "");
  assert.notEqual(colors.get("SELECTION_BACKGROUND"), attributes.get("TEXT")?.get("BACKGROUND"));
});

test("the console uses the sixteen colors of the palette", () => {
  const sixteen = palette.ansi.map((name) => palette.colors[name]);
  assert.deepEqual(
    consoleSlots.map((slot) => foreground(`CONSOLE_${slot}_OUTPUT`)),
    sixteen,
  );
  assert.deepEqual(
    [...terminalSlots.map((slot) => foreground(`BLOCK_TERMINAL_${slot}`)), ...terminalSlots.map((slot) => foreground(`BLOCK_TERMINAL_${slot}_BRIGHT`))],
    sixteen,
  );
});

test("every syntax role reaches the scheme with its color and style", () => {
  const failures: string[] = [];
  for (const [name, key] of pairs) {
    const expected = palette.colors[role(name).color];
    if (!role(name).jetbrains?.includes(key)) failures.push(`${name}: ${key} is not in the shared table`);
    if (foreground(key) !== expected) failures.push(`${name}: ${key} is ${foreground(key)}, expected ${expected}`);
  }
  assert.equal(attributes.get("MARKDOWN_BOLD")?.get("FONT_TYPE"), "1");
  assert.equal(attributes.get("MARKDOWN_LINK_DESTINATION")?.get("EFFECT_TYPE"), "1");
  assert.equal(failures.length, 0, report(failures));
});

test("the key roles have the color the neovim plugin gives them", (context) => {
  const groups = pairs.map(([, , group]) => group);
  const lua = `local out = {} for _, name in ipairs(vim.json.decode('${JSON.stringify(groups)}')) do out[name] = string.format('#%06x', vim.api.nvim_get_hl(0, { name = name, link = false }).fg) end io.stdout:write(vim.json.encode(out))`;
  const result = spawnSync("nvim", ["--headless", "--clean", "--cmd", `set runtimepath^=${root}`, "-c", "colorscheme sotto", "-c", `lua ${lua}`, "-c", "qa!"], {
    encoding: "utf8",
  });
  if (result.error) {
    context.skip("nvim is not installed");
    return;
  }
  assert.equal(result.status, 0, result.stderr);
  const plugin = JSON.parse(result.stdout) as Record<string, string>;
  const failures = pairs
    .filter(([, key, group]) => foreground(key) !== plugin[group])
    .map(([name, key, group]) => `${name}: ${key} is ${foreground(key)}, neovim ${group} has ${plugin[group]}`);
  assert.equal(failures.length, 0, report(failures));
});

test("xmllint accepts both xml files", (context) => {
  const result = spawnSync("xmllint", ["--noout", "-"], { input: file("sotto.xml"), encoding: "utf8" });
  if (result.error) {
    context.skip("xmllint is not installed");
    return;
  }
  assert.equal(result.status, 0, result.stderr);
  const descriptor = spawnSync("xmllint", ["--noout", "-"], { input: file("META-INF/plugin.xml"), encoding: "utf8" });
  assert.equal(descriptor.status, 0, descriptor.stderr);
});
