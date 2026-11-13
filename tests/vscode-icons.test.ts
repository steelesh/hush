import assert from "node:assert/strict";
import { posix } from "node:path";
import { test } from "node:test";
import { files, folders } from "../src/icons/catalog.ts";
import { load } from "../src/palette.ts";
import { vscode } from "../src/targets/vscode.ts";
import { iconThemes } from "../src/targets/vscode-icons.ts";

type IconTheme = {
  showLanguageModeIcons: boolean;
  iconDefinitions: Record<string, { iconPath: string }>;
  file: string;
  folder: string;
  folderExpanded: string;
  rootFolder: string;
  rootFolderExpanded: string;
  folderNames: Record<string, string>;
  folderNamesExpanded: Record<string, string>;
  fileExtensions: Record<string, string>;
  fileNames: Record<string, string>;
  languageIds: Record<string, string>;
};

const palette = load();
const output = new Map(vscode.files(palette).map(({ path, content }) => [path, content]));
const base = "themes/vscode/icons";
const themes = iconThemes.map(({ id }) => JSON.parse(output.get(`${base}/${id}-icon-theme.json`) ?? "") as IconTheme);
const [color, quiet] = themes;
const colored = (svg: string) => new Set(svg.match(/#[a-f0-9]{6}\b/g) ?? []);

function asset(theme: IconTheme, id: string): string {
  const path = posix.join(base, theme.iconDefinitions[id]?.iconPath ?? "");
  assert.ok(path.startsWith(`${base}/`), `icon escapes its package: ${id}`);
  const svg = output.get(path);
  assert.ok(svg, `missing icon asset: ${path}`);
  return svg;
}

test("every icon association resolves to a packaged vector in palette colors", () => {
  const known = new Set(Object.values(palette.colors));
  for (const theme of themes) {
    const maps = [theme.folderNames, theme.folderNamesExpanded, theme.fileExtensions, theme.fileNames, theme.languageIds];
    const references = new Set([theme.file, theme.folder, theme.folderExpanded, theme.rootFolder, theme.rootFolderExpanded, ...maps.flatMap(Object.values)]);
    assert.equal(theme.showLanguageModeIcons, false);
    for (const id of references) assert.ok(theme.iconDefinitions[id], `missing icon definition: ${id}`);
    for (const id of Object.keys(theme.iconDefinitions)) {
      assert.ok(references.has(id), `unused icon: ${id}`);
      const svg = asset(theme, id);
      assert.match(svg, /width="16" height="16" viewBox="0 0 16 16"/);
      assert.doesNotMatch(svg, /<text|<script|<image|(?:href|style)=/);
      for (const hex of colored(svg)) assert.ok(known.has(hex), `${id} uses a color outside the palette: ${hex}`);
    }
    for (const associations of maps) {
      for (const key of Object.keys(associations)) {
        assert.equal(key, key.toLowerCase());
        assert.doesNotMatch(key, /[*?\\]/);
      }
    }
    for (const extension of Object.keys(theme.fileExtensions)) {
      assert.ok(!extension.slice(extension.lastIndexOf("/") + 1).startsWith("."), extension);
      assert.ok(extension.split("/").length <= 2, `${extension} names more than one parent folder`);
    }
  }
});

test("the quiet theme is the color theme drawn in one tone", () => {
  assert.ok(color && quiet);
  const paths = (theme: IconTheme) => Object.keys(theme.iconDefinitions);
  assert.deepEqual(paths(quiet), paths(color));
  assert.deepEqual({ ...quiet, iconDefinitions: {} }, { ...color, iconDefinitions: {} });
  for (const id of paths(quiet)) assert.deepEqual([...colored(asset(quiet, id))], [palette.colors.breath], `${id} is not drawn in breath alone`);
  assert.ok(new Set(paths(color).flatMap((id) => [...colored(asset(color, id))])).size > 6, "the color theme lost its colors");
});

test("folders fall back to one outline and named folders carry a badge", () => {
  for (const theme of themes) {
    assert.equal(theme.folder, "folder");
    assert.equal(theme.folderExpanded, theme.folder);
    assert.equal(theme.rootFolder, theme.folder);
    assert.equal(theme.rootFolderExpanded, theme.folder);
    assert.deepEqual(theme.folderNamesExpanded, theme.folderNames);
    assert.equal((asset(theme, "folder").match(/<path/g) ?? []).length, 1);
    for (const { name } of folders) assert.equal((asset(theme, `folder-${name}`).match(/<path/g) ?? []).length, 2, `folder-${name} has no badge`);
  }
});

test("every catalog entry is reachable and draws a distinct mark where it claims to", () => {
  for (const icon of files) assert.ok(icon.extensions?.length || icon.filenames?.length || icon.languages?.length, `${icon.name} matches no file`);
  for (const icon of folders) assert.ok(icon.names.length > 0, `folder ${icon.name} matches no folder`);
});

function resolve(theme: IconTheme, filename: string, language: string): string {
  const lower = filename.toLowerCase();
  if (theme.fileNames[lower]) return theme.fileNames[lower];
  const segments = lower.split(".");
  for (let index = 1; index < segments.length; index++) {
    const matched = theme.fileExtensions[segments.slice(index).join(".")];
    if (matched) return matched;
  }
  return theme.languageIds[language] ?? theme.file;
}

test("specific filenames and compound extensions resolve to the expected icon", () => {
  assert.ok(color);
  const examples: [string, string, string][] = [
    ["app.ts", "typescript", "typescript"],
    ["types.d.ts", "typescript", "typescript"],
    ["retry.go", "go", "go"],
    ["Main.java", "java", "java"],
    ["Program.cs", "csharp", "csharp"],
    ["package.json", "json", "npm"],
    ["pnpm-lock.yaml", "yaml", "pnpm"],
    ["Cargo.toml", "toml", "rust"],
    ["Dockerfile", "dockerfile", "docker"],
    ["vite.config.ts", "typescript", "vite"],
    ["data.json", "json", "json"],
    ["notes.md", "markdown", "markdown"],
    ["logo.png", "image", "image"],
    ["custom.unrecognized", "custom-language", "file"],
  ];
  for (const [filename, language, icon] of examples) assert.equal(resolve(color, filename, language), icon, filename);
  assert.equal(color.folderNames[".github"], "folder-github");
});
