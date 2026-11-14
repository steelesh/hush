import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { luminance } from "../src/color.ts";
import { load } from "../src/palette.ts";
import { vscode } from "../src/targets/vscode.ts";
import { read, report, root } from "./support.ts";

type Theme = {
  $schema: string;
  name: string;
  type: string;
  semanticHighlighting: boolean;
  colors: Record<string, string>;
  tokenColors: { scope: string[]; settings: { foreground: string } }[];
  semanticTokenColors: Record<string, unknown>;
};
type Reference = { source: string; approved: string; fetched: string; ids: string[]; translucent: string[]; opaque: string[] };

const palette = load();
const output = new Map(vscode.files(palette).map((file) => [file.path, file.content]));
const theme = JSON.parse(output.get("themes/vscode/themes/sotto-color-theme.json") ?? "") as Theme;
const manifest = JSON.parse(output.get("themes/vscode/package.json") ?? "");
const meta = JSON.parse(read("package.json"));
const reference = JSON.parse(read("tests/vscode-colors.json")) as Reference;
const origin = `tests/vscode-colors.json lists the ids on ${reference.source} as approved ${reference.approved} and read ${reference.fetched}`;

const hues = ["Black", "Red", "Green", "Yellow", "Blue", "Magenta", "Cyan", "White"];

const shared: [scope: string, group: string][] = [
  ["comment", "@comment"],
  ["keyword", "@keyword"],
  ["entity.name.function", "@function"],
  ["string", "@string"],
  ["entity.name.type", "@type"],
  ["variable.parameter", "@variable.parameter"],
  ["meta.annotation", "@attribute"],
  ["entity.name.function.decorator", "@lsp.type.decorator"],
];

test("the extension manifest contributes color themes and file icons without executable code", () => {
  assert.deepEqual(manifest, {
    name: meta.name,
    displayName: "Sotto",
    description: meta.description,
    version: meta.version,
    publisher: "steelesh",
    license: meta.license,
    repository: meta.repository,
    homepage: meta.homepage,
    bugs: { url: `${meta.repository.url}/issues` },
    engines: { vscode: manifest.engines.vscode },
    categories: ["Themes"],
    keywords: ["dark", "quiet", "pastel", "muted", "soft", "calm", "minimal", "low-contrast", "oled", "color-theme", "icon-theme", "file-icons"],
    icon: "icon.png",
    galleryBanner: { color: palette.colors.pitch, theme: "dark" },
    contributes: {
      themes: [
        { label: "Sotto", uiTheme: "vs-dark", path: "./themes/sotto-color-theme.json" },
        { label: "Sotto Black", uiTheme: "vs-dark", path: "./themes/sotto-black-color-theme.json" },
      ],
      iconThemes: [
        { id: "sotto", label: "Sotto", path: "./icons/sotto-icon-theme.json" },
        { id: "sotto-quiet", label: "Sotto Quiet", path: "./icons/sotto-quiet-icon-theme.json" },
      ],
    },
    files: ["LICENSE", "NOTICE", "icon.png", "themes", "icons"],
  });
  assert.match(manifest.version, /^\d+\.\d+\.\d+$/);
  assert.match(manifest.engines.vscode, /^\^1\.\d+\.0$/);
  assert.ok(output.has("themes/vscode/themes/sotto-color-theme.json"), "the manifest points at a file the target does not write");
  assert.equal(output.get("themes/vscode/LICENSE"), read("LICENSE"));
  const icon = readFileSync(join(root, "assets/icon.png"));
  assert.equal(icon.subarray(1, 4).toString(), "PNG", "assets/icon.png is not a png");
  assert.ok(icon.readUInt32BE(16) >= 256 && icon.readUInt32BE(16) === icon.readUInt32BE(20), "assets/icon.png must be square and at least 256 pixels");
  assert.ok(read("README.md").includes(meta.description), "README.md no longer carries the description in package.json");
  assert.ok(output.get("themes/vscode/README.md")?.includes(meta.description));
});

test("the theme file has exactly the parts a dark semantic color theme needs", () => {
  assert.deepEqual(Object.keys(theme), ["$schema", "name", "type", "semanticHighlighting", "colors", "tokenColors", "semanticTokenColors"]);
  assert.equal(theme.$schema, "vscode://schemas/color-theme");
  assert.equal(theme.name, "Sotto");
  assert.equal(theme.type, "dark");
  assert.equal(theme.semanticHighlighting, true);
});

test("every workbench color id is one vs code documents", () => {
  const known = new Set(reference.ids);
  const failures = Object.keys(theme.colors)
    .filter((id) => !known.has(id))
    .map((id) => `${id} is not a documented workbench color`);
  assert.ok(Object.keys(theme.colors).length > 0, "the theme sets no workbench colors");
  assert.equal(failures.length, 0, `${report(failures)}\n${origin}`);
});

test("every workbench color is #rrggbb or #rrggbbaa", () => {
  const failures = Object.entries(theme.colors)
    .filter(([, value]) => !/^#[0-9a-f]{6}([0-9a-f]{2})?$/.test(value))
    .map(([id, value]) => `${id}: ${value}`);
  assert.equal(failures.length, 0, report(failures));
});

test("colors documented as needing transparency are translucent and those documented as opaque are opaque", () => {
  const translucent = /^#[0-9a-f]{6}(?!ff)[0-9a-f]{2}$/;
  const opaque = /^#[0-9a-f]{6}(ff)?$/;
  const breaking = (ids: string[], allowed: RegExp, rule: string) =>
    ids.flatMap((id) => {
      const value = theme.colors[id];
      return value === undefined || allowed.test(value) ? [] : [`${id}: ${value} ${rule}`];
    });
  const failures = [...breaking(reference.translucent, translucent, "must not be opaque"), ...breaking(reference.opaque, opaque, "must be opaque")];
  assert.ok(reference.translucent.some((id) => id in theme.colors) && reference.opaque.some((id) => id in theme.colors));
  assert.equal(failures.length, 0, `${report(failures)}\n${origin}, where the description of each id states the requirement`);
});

test("the terminal uses the sixteen colors of the palette on the terminal page", () => {
  const terminal = [...hues.map((hue) => `terminal.ansi${hue}`), ...hues.map((hue) => `terminal.ansiBright${hue}`)].map((id) => theme.colors[id]);
  assert.deepEqual(
    terminal,
    palette.ansi.map((name) => palette.colors[name]),
  );
  assert.equal(theme.colors["terminal.background"], palette.colors.still);
  assert.equal(theme.colors["editor.background"], palette.colors.still);
  const black = JSON.parse(output.get("themes/vscode/themes/sotto-black-color-theme.json") ?? "") as Theme;
  assert.equal(black.name, "Sotto Black");
  assert.equal(black.colors["editor.background"], palette.colors.pitch);
  assert.equal(black.colors["terminal.background"], palette.colors.pitch);
  assert.deepEqual(Object.keys(black.colors), Object.keys(theme.colors));
  assert.deepEqual(black.tokenColors, theme.tokenColors);
});

test("folds have no fill and optional current lines are quieter than selections", () => {
  for (const file of ["sotto", "sotto-black"]) {
    const { colors } = JSON.parse(output.get(`themes/vscode/themes/${file}-color-theme.json`) ?? "") as Theme;
    assert.equal(colors["editor.foldBackground"]?.slice(-2), "00");
    assert.equal(colors["editor.foldPlaceholderForeground"], palette.colors.whisper);
    assert.equal(colors["editor.selectionForeground"], undefined);
    assert.equal(colors["editor.lineHighlightBackground"], palette.colors.room);
    assert.ok(luminance(colors["editor.lineHighlightBackground"] ?? "") < luminance(colors["editor.selectionBackground"] ?? ""));
  }
});

test("the key roles have the color the neovim plugin gives them", (context) => {
  const groups = shared.map(([, group]) => group);
  const lua = `local out = {} for _, name in ipairs(vim.json.decode('${JSON.stringify(groups)}')) do out[name] = string.format('#%06x', vim.api.nvim_get_hl(0, { name = name, link = false }).fg) end io.stdout:write(vim.json.encode(out))`;
  const result = spawnSync("nvim", ["--headless", "--clean", "--cmd", `set runtimepath^=${root}`, "-c", "colorscheme sotto", "-c", `lua ${lua}`, "-c", "qa!"], {
    encoding: "utf8",
  });
  if (result.error && !process.env.CI) {
    context.skip("nvim is not installed, so this comparison did not run");
    return;
  }
  assert.equal(result.status, 0, `nvim did not run: ${result.error?.message ?? result.stderr}`);
  const plugin = JSON.parse(result.stdout) as Record<string, string>;
  const failures: string[] = [];
  for (const [scope, group] of shared) {
    const token = theme.tokenColors.find((entry) => entry.scope.includes(scope));
    if (token?.settings.foreground !== plugin[group])
      failures.push(`${scope}: vs code has ${token?.settings.foreground}, neovim ${group} has ${plugin[group]}`);
  }
  assert.equal(failures.length, 0, report(failures));
});
