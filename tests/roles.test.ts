import assert from "node:assert/strict";
import { test } from "node:test";
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
  "themes/ghostty/hush": [
    ["page", key("background"), "pitch"],
    ["text", key("foreground"), "voice"],
    ["cursor", key("cursor-color"), "caret"],
    ["selection", key("selection-background"), "held"],
    ["current search match", key("search-selected-background"), "call"],
  ],
  "themes/tmux/hush.conf": [
    ["status text", /^set -g status-style "fg=(#[0-9a-f]{6}),bg=default"$/m, "murmur"],
    ["current window", /^set -g window-status-current-style "fg=(#[0-9a-f]{6}),bold"$/m, "call"],
    ["selection", /^set -g copy-mode-selection-style "bg=(#[0-9a-f]{6})"$/m, "held"],
    ["current search match", /^set -g copy-mode-current-match-style "fg=#[0-9a-f]{6},bg=(#[0-9a-f]{6})"$/m, "call"],
  ],
  "themes/fzf/hush.fzf": [
    ["text", /^--color=fg:(#[0-9a-f]{6})$/m, "voice"],
    ["current item", /^--color=bg\+:(#[0-9a-f]{6})$/m, "near"],
    ["matched characters", /^--color=hl:(#[0-9a-f]{6}):bold$/m, "call"],
    ["border", /^--color=border:(#[0-9a-f]{6})$/m, "trace"],
  ],
  "themes/delta/hush.gitconfig": [
    ["removed line", /^\tminus-style = syntax "(#[0-9a-f]{6})"$/m, "tint_delete"],
    ["added line", /^\tplus-style = syntax "(#[0-9a-f]{6})"$/m, "tint_add"],
    ["removed line number", /^\tline-numbers-minus-style = "(#[0-9a-f]{6})"$/m, "sharp"],
    ["added line number", /^\tline-numbers-plus-style = "(#[0-9a-f]{6})"$/m, "grown"],
    ["file name", /^\tfile-style = "(#[0-9a-f]{6})" bold$/m, "call"],
  ],
  "themes/bat/hush.tmTheme": [
    ["text", /<key>foreground<\/key>\s*<string>(#[0-9a-f]{6})<\/string>\s*<key>lineHighlight<\/key>/, "voice"],
    ["highlighted line", /<key>lineHighlight<\/key>\s*<string>(#[0-9a-f]{6})<\/string>/, "lull"],
  ],
  "themes/lazygit/hush.yml": [
    ["text", /defaultFgColor:\n\s+- '(#[0-9a-f]{6})'/, "voice"],
    ["active border", /activeBorderColor:\n\s+- '(#[0-9a-f]{6})'/, "call"],
    ["current item", /selectedLineBgColor:\n\s+- '(#[0-9a-f]{6})'/, "near"],
    ["unstaged changes", /unstagedChangesColor:\n\s+- '(#[0-9a-f]{6})'/, "sharp"],
  ],
  "themes/yazi/hush.toml": [
    ["working directory", /^cwd = \{ fg = "(#[0-9a-f]{6})" \}$/m, "voice"],
    ["border", /^border_style = \{ fg = "(#[0-9a-f]{6})" \}$/m, "trace"],
    ["cut marker", /^marker_cut = \{ fg = "(#[0-9a-f]{6})"/m, "sharp"],
    ["copied marker", /^marker_copied = \{ fg = "(#[0-9a-f]{6})"/m, "grown"],
    ["current item", /^current = \{ bg = "(#[0-9a-f]{6})"/m, "near"],
  ],
  "themes/starship/hush.toml": [
    ["text", key("white"), "voice"],
    ["red", key("red"), "sharp"],
    ["green", key("green"), "grown"],
    ["blue", key("blue"), "cue"],
    ["dim text", key("bright-black"), "whisper"],
  ],
  "themes/btop/hush.theme": [
    ["page", /^theme\[main_bg\]="(#[0-9a-f]{6})"$/m, "pitch"],
    ["text", /^theme\[main_fg\]="(#[0-9a-f]{6})"$/m, "voice"],
    ["highlight", /^theme\[hi_fg\]="(#[0-9a-f]{6})"$/m, "call"],
    ["current item", /^theme\[selected_bg\]="(#[0-9a-f]{6})"$/m, "near"],
  ],
  "themes/lnav/hush.json": [
    ["text", /"text": \{"color":"(#[0-9a-f]{6})"/, "voice"],
    ["ok", /"ok": \{"color":"(#[0-9a-f]{6})"\}/, "grown"],
    ["info", /"info": \{"color":"(#[0-9a-f]{6})"\}/, "cue"],
    ["warning", /"warning": \{"color":"(#[0-9a-f]{6})"\}/, "flat"],
    ["error", /"error": \{"color":"(#[0-9a-f]{6})"\}/, "sharp"],
  ],
  "themes/fastfetch/hush.jsonc": [
    ["keys", /"keys": "(#[0-9a-f]{6})"/, "murmur"],
    ["output", /"output": "(#[0-9a-f]{6})"/, "voice"],
  ],
  "themes/borders/hush.sh": [["active border", /^active_color=0xff([0-9a-f]{6})$/m, "murmur"]],
  "themes/bman/hush.css": sheet,
  "themes/bmd/hush.css": sheet,
  "themes/vscode/package.json": [["marketplace banner", /"color": "(#[0-9a-f]{6})"/, "pitch"]],
  "themes/vscode/themes/hush-color-theme.json": [
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
  "themes/jetbrains/hush.theme.json": [
    ["text", /"voice": "(#[0-9a-f]{6})"/, "voice"],
    ["accent", /"call": "(#[0-9a-f]{6})"/, "call"],
  ],
  "themes/jetbrains/META-INF/pluginIcon.svg": [
    ["page", /<rect width="40" height="40" rx="9" fill="(#[0-9a-f]{6})"\/>/, "still"],
    ["tallest bar", /height="19" rx="2.5" fill="(#[0-9a-f]{6})"\/>/, "call"],
  ],
  "themes/jetbrains/hush.xml": [
    ["cursor", /<option name="CARET_COLOR" value="([0-9a-f]{6})"/, "caret"],
    ["selection", /<option name="SELECTION_BACKGROUND" value="([0-9a-f]{6})"/, "held"],
  ],
};

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
  const unrecorded = [...built.keys()].filter((path) => !(path in snapshot) && /#[0-9a-f]{6}/.test(built.get(path) ?? "") && path !== "lua/hush/palette.lua");
  assert.deepEqual(unrecorded, []);
});

test("the neovim palette gives every name its own color", () => {
  const failures: string[] = [];
  for (const path of ["lua/hush/palette.lua"]) {
    const pairs = [...(built.get(path) ?? "").matchAll(/^\s*"?([a-z_]+)"?\s*[:=]\s*"(#[0-9a-f]{6})",?$/gm)];
    if (pairs.length === 0) failures.push(`${path}: no named colors found`);
    for (const [, name, value] of pairs) {
      if (c[name as Name] !== value) failures.push(`${path}: ${name} is ${value}, expected ${c[name as Name] ?? "a palette name"}`);
    }
  }
  assert.equal(failures.length, 0, report(failures));
});
