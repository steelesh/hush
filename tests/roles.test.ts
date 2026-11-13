import assert from "node:assert/strict";
import { test } from "node:test";
import * as icons from "../src/icons/catalog.ts";
import { load, type Name } from "../src/palette.ts";
import { targets } from "../src/targets/index.ts";
import { report } from "./support.ts";

type Probe = [what: string, pattern: RegExp, name: Name];

const palette = load();
const c = palette.colors;
const built = new Map(targets.flatMap((target) => target.files(palette)).map((file) => [file.path, file.content]));
const named = new Map(Object.entries(c).map(([name, value]) => [value, name]));

const key = (name: string) => new RegExp(`^\\s*${name}\\s*=\\s*"?(#[0-9a-f]{6})"?$`, "m");
const custom = (name: string) => new RegExp(`^\\s*--${name}: (#[0-9a-f]{6});$`, "m");
const sheet: Probe[] = [
  ["page", custom("bg"), "still"],
  ["text", custom("fg"), "voice"],
  ["secondary text", custom("fg-dim"), "whisper"],
  ["border", custom("border"), "trace"],
  ["selection", custom("selection"), "held"],
];

const snapshot: Record<string, Probe[]> = {
  "themes/ghostty/sotto": [
    ["page", key("background"), "pitch"],
    ["text", key("foreground"), "voice"],
    ["cursor", key("cursor-color"), "caret"],
    ["selection", key("selection-background"), "held"],
    ["current search match", key("search-selected-background"), "call"],
  ],
  "themes/tmux/sotto.conf": [
    ["status text", /^set -g status-style "fg=(#[0-9a-f]{6}),bg=default"$/m, "murmur"],
    ["current window", /^set -g window-status-current-style "fg=(#[0-9a-f]{6}),bold"$/m, "call"],
    ["selection", /^set -g copy-mode-selection-style "bg=(#[0-9a-f]{6})"$/m, "held"],
    ["current search match", /^set -g copy-mode-current-match-style "fg=#[0-9a-f]{6},bg=(#[0-9a-f]{6})"$/m, "call"],
  ],
  "themes/fzf/sotto.fzf": [
    ["text", /^--color=fg:(#[0-9a-f]{6})$/m, "voice"],
    ["current item", /^--color=bg\+:(#[0-9a-f]{6})$/m, "near"],
    ["matched characters", /^--color=hl:(#[0-9a-f]{6}):bold$/m, "call"],
    ["border", /^--color=border:(#[0-9a-f]{6})$/m, "trace"],
  ],
  "themes/delta/sotto.gitconfig": [
    ["removed line", /^\tminus-style = syntax "(#[0-9a-f]{6})"$/m, "tint_delete"],
    ["added line", /^\tplus-style = syntax "(#[0-9a-f]{6})"$/m, "tint_add"],
    ["removed line number", /^\tline-numbers-minus-style = "(#[0-9a-f]{6})"$/m, "sharp"],
    ["added line number", /^\tline-numbers-plus-style = "(#[0-9a-f]{6})"$/m, "grown"],
    ["file name", /^\tfile-style = "(#[0-9a-f]{6})" bold$/m, "call"],
  ],
  "themes/bat/sotto.tmTheme": [
    ["text", /<key>foreground<\/key>\s*<string>(#[0-9a-f]{6})<\/string>\s*<key>lineHighlight<\/key>/, "voice"],
    ["highlighted line", /<key>lineHighlight<\/key>\s*<string>(#[0-9a-f]{6})<\/string>/, "lull"],
  ],
  "themes/lazygit/sotto.yml": [
    ["text", /defaultFgColor:\n\s+- '(#[0-9a-f]{6})'/, "voice"],
    ["active border", /activeBorderColor:\n\s+- '(#[0-9a-f]{6})'/, "call"],
    ["current item", /selectedLineBgColor:\n\s+- '(#[0-9a-f]{6})'/, "near"],
    ["unstaged changes", /unstagedChangesColor:\n\s+- '(#[0-9a-f]{6})'/, "sharp"],
  ],
  "themes/yazi/sotto.toml": [
    ["working directory", /^cwd = \{ fg = "(#[0-9a-f]{6})" \}$/m, "voice"],
    ["border", /^border_style = \{ fg = "(#[0-9a-f]{6})" \}$/m, "trace"],
    ["cut marker", /^marker_cut = \{ fg = "(#[0-9a-f]{6})"/m, "sharp"],
    ["copied marker", /^marker_copied = \{ fg = "(#[0-9a-f]{6})"/m, "grown"],
    ["current item", /^current = \{ bg = "(#[0-9a-f]{6})"/m, "near"],
  ],
  "themes/starship/sotto.toml": [
    ["text", key("white"), "voice"],
    ["red", key("red"), "sharp"],
    ["green", key("green"), "grown"],
    ["blue", key("blue"), "cue"],
    ["dim text", key("bright-black"), "whisper"],
  ],
  "themes/btop/sotto.theme": [
    ["page", /^theme\[main_bg\]="(#[0-9a-f]{6})"$/m, "pitch"],
    ["text", /^theme\[main_fg\]="(#[0-9a-f]{6})"$/m, "voice"],
    ["highlight", /^theme\[hi_fg\]="(#[0-9a-f]{6})"$/m, "call"],
    ["current item", /^theme\[selected_bg\]="(#[0-9a-f]{6})"$/m, "near"],
  ],
  "themes/lnav/sotto.json": [
    ["text", /"text": \{"color":"(#[0-9a-f]{6})"/, "voice"],
    ["ok", /"ok": \{"color":"(#[0-9a-f]{6})"\}/, "grown"],
    ["info", /"info": \{"color":"(#[0-9a-f]{6})"\}/, "cue"],
    ["warning", /"warning": \{"color":"(#[0-9a-f]{6})"\}/, "flat"],
    ["error", /"error": \{"color":"(#[0-9a-f]{6})"\}/, "sharp"],
  ],
  "themes/fastfetch/sotto.jsonc": [
    ["keys", /"keys": "(#[0-9a-f]{6})"/, "murmur"],
    ["output", /"output": "(#[0-9a-f]{6})"/, "voice"],
  ],
  "themes/borders/sotto.sh": [["active border", /^active_color=0xff([0-9a-f]{6})$/m, "murmur"]],
  "themes/bman/sotto.css": sheet,
  "themes/bmd/sotto.css": sheet,
  "themes/vscode/package.json": [["marketplace banner", /"color": "(#[0-9a-f]{6})"/, "pitch"]],
  "themes/vscode/themes/sotto-color-theme.json": [
    ["page", /"editor\.background": "(#[0-9a-f]{6})"/, "still"],
    ["text", /"editor\.foreground": "(#[0-9a-f]{6})"/, "voice"],
    ["cursor", /"editorCursor\.foreground": "(#[0-9a-f]{6})"/, "caret"],
    ["selection", /"editor\.selectionBackground": "(#[0-9a-f]{6})"/, "held"],
    ["error", /"editorError\.foreground": "(#[0-9a-f]{6})"/, "sharp"],
    ["warning", /"editorWarning\.foreground": "(#[0-9a-f]{6})"/, "flat"],
    ["info", /"editorInfo\.foreground": "(#[0-9a-f]{6})"/, "cue"],
    ["hint", /"editorHint\.foreground": "(#[0-9a-f]{6})"/, "nudge"],
    ["added", /"gitDecoration\.addedResourceForeground": "(#[0-9a-f]{6})"/, "grown"],
    ["current search match", /"editor\.findMatchBackground": "(#[0-9a-f]{6})"/, "call"],
  ],
  "themes/vscode/themes/sotto-black-color-theme.json": [
    ["page", /"editor\.background": "(#[0-9a-f]{6})"/, "pitch"],
    ["text", /"editor\.foreground": "(#[0-9a-f]{6})"/, "voice"],
  ],
  "themes/jetbrains/sotto-black.theme.json": [
    ["page", /"still": "(#[0-9a-f]{6})"/, "pitch"],
    ["accent", /"call": "(#[0-9a-f]{6})"/, "call"],
  ],
  "themes/jetbrains/sotto-black.xml": [
    ["page", /<option name="GUTTER_BACKGROUND" value="([0-9a-f]{6})"/, "pitch"],
    ["cursor", /<option name="CARET_COLOR" value="([0-9a-f]{6})"/, "caret"],
  ],
  "themes/jetbrains/sotto.theme.json": [
    ["text", /"voice": "(#[0-9a-f]{6})"/, "voice"],
    ["accent", /"call": "(#[0-9a-f]{6})"/, "call"],
  ],
  "themes/jetbrains/META-INF/pluginIcon.svg": [
    ["page", /<rect width="40" height="40" rx="9" fill="(#[0-9a-f]{6})"\/>/, "still"],
    ["tallest bar", /height="19" rx="2.5" fill="(#[0-9a-f]{6})"\/>/, "call"],
  ],
  "themes/jetbrains/sotto.xml": [
    ["cursor", /<option name="CARET_COLOR" value="([0-9a-f]{6})"/, "caret"],
    ["selection", /<option name="SELECTION_BACKGROUND" value="([0-9a-f]{6})"/, "held"],
  ],
};

const folderRoles: Record<string, [Name, Name]> = {
  folder: ["rest", "tint_change"],
  package: ["rest", "tint_change"],
  project: ["cue", "tint_change"],
  "module-group": ["cue", "tint_change"],
  "java-module": ["cue", "tint_change"],
  unloaded: ["breath", "near"],
  source: ["cue", "tint_change"],
  test: ["grown", "tint_add"],
  "test-source": ["grown", "tint_add"],
  excluded: ["said", "tint_search"],
  resources: ["nudge", "tint_change"],
  "test-resources": ["grown", "tint_add"],
  generated: ["murmur", "near"],
  "generated-source": ["cue", "tint_change"],
  "generated-test": ["grown", "tint_add"],
  "generated-excluded": ["said", "tint_search"],
  library: ["cue", "tint_change"],
  "native-library": ["cue", "tint_change"],
  compiled: ["form", "tint_add"],
  home: ["rest", "tint_change"],
  docs: ["said", "tint_search"],
  log: ["murmur", "near"],
  annotation: ["nudge", "tint_change"],
  template: ["nudge", "tint_change"],
  web: ["rest", "tint_change"],
  "unmark-web": ["breath", "near"],
  github: ["rest", "tint_change"],
  config: ["murmur", "near"],
  copy: ["rest", "tint_change"],
  edit: ["rest", "tint_change"],
  extracted: ["cue", "tint_change"],
  up: ["rest", "tint_change"],
  "new": ["grown", "tint_add"],
  "add-excluded": ["said", "tint_search"],
  "module-layer": ["cue", "tint_change"],
  "source-layer": ["cue", "tint_change"],
};

for (const [name, [stroke, fill]] of Object.entries(folderRoles)) {
  snapshot[`themes/jetbrains/icons/sotto/folders/${name}.svg`] = [
    ["outline", /stroke="(#[0-9a-f]{6})"/, stroke],
    ["surface", /fill="(#[0-9a-f]{6})"/, fill],
  ];
}

for (const [folder, pick] of [
  ["color", (tone: Name) => tone],
  ["quiet", (): Name => "breath"],
] as const) {
  const outline: Probe = ["outline", /stroke="(#[0-9a-f]{6})"/, "breath"];
  snapshot[`themes/vscode/icons/${folder}/folder.svg`] = [outline];
  for (const icon of icons.files) snapshot[`themes/vscode/icons/${folder}/${icon.name}.svg`] = [["mark", /fill="(#[0-9a-f]{6})"/, pick(icon.tone)]];
  for (const icon of icons.folders)
    snapshot[`themes/vscode/icons/${folder}/folder-${icon.name}.svg`] = [outline, ["badge", /fill="(#[0-9a-f]{6})"/, pick(icon.tone)]];
}

for (const icon of icons.files) {
  const path = `themes/jetbrains/icons/sotto/files/${icon.name}.svg`;
  if (built.has(path)) snapshot[path] = [["mark", /fill="(#[0-9a-f]{6})"/, icon.tone]];
}

test("each target draws its key roles in the colors recorded here", () => {
  const failures: string[] = [];
  for (const [path, probes] of Object.entries(snapshot)) {
    const content = built.get(path);
    if (content === undefined) {
      failures.push(`${path}: recorded here but no target writes it`);
      continue;
    }
    for (const [what, pattern, name] of probes) {
      const found = content.match(pattern)?.[1] ?? "nothing this test can find";
      const drawn = named.get(found) ?? named.get(`#${found}`) ?? found;
      if (drawn !== name) failures.push(`${path}: ${what} is drawn as ${drawn}, expected ${name}`);
    }
  }
  assert.equal(failures.length, 0, `${report(failures)}\nif a change is intended, record it in tests/roles.test.ts`);
});

test("every target that writes colors has key roles recorded", () => {
  const unrecorded = [...built.keys()].filter((path) => !(path in snapshot) && /#[0-9a-f]{6}/.test(built.get(path) ?? "") && path !== "lua/sotto/palette.lua");
  assert.deepEqual(unrecorded, []);
});

test("the neovim palette gives every name its own color", () => {
  const failures: string[] = [];
  for (const path of ["lua/sotto/palette.lua"]) {
    const pairs = [...(built.get(path) ?? "").matchAll(/^\s*"?([a-z_]+)"?\s*[:=]\s*"(#[0-9a-f]{6})",?$/gm)];
    if (pairs.length === 0) failures.push(`${path}: no named colors found`);
    for (const [, name, value] of pairs) {
      if (c[name as Name] !== value) failures.push(`${path}: ${name} is ${value}, expected ${c[name as Name] ?? "a palette name"}`);
    }
  }
  assert.equal(failures.length, 0, report(failures));
});
