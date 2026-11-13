import assert from "node:assert/strict";
import { posix } from "node:path";
import { test } from "node:test";
import { load } from "../src/palette.ts";
import { folderDefinitions, folderSvg } from "../src/targets/jetbrains/icons.ts";
import { vscode } from "../src/targets/vscode.ts";

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
const theme = JSON.parse(output.get(`${base}/sotto-icon-theme.json`) ?? "") as IconTheme;
const maps = [theme.folderNames, theme.folderNamesExpanded, theme.fileExtensions, theme.fileNames, theme.languageIds];

test("every icon association resolves to a packaged vector with palette colors", () => {
  assert.equal(theme.showLanguageModeIcons, false);
  const references = [theme.file, theme.folder, theme.folderExpanded, theme.rootFolder, theme.rootFolderExpanded, ...maps.flatMap(Object.values)];
  const known = new Set(Object.values(palette.colors));
  for (const id of references) assert.ok(theme.iconDefinitions[id], `missing icon definition: ${id}`);
  for (const [id, { iconPath }] of Object.entries(theme.iconDefinitions)) {
    assert.ok(references.includes(id), `unused icon: ${id}`);
    const asset = posix.join(base, iconPath);
    assert.ok(asset.startsWith(`${base}/`), `icon escapes its package: ${id}`);
    const svg = output.get(asset);
    assert.ok(svg, `missing icon asset: ${asset}`);
    assert.match(svg, /width="16" height="16" viewBox="0 0 16 16"/);
    assert.doesNotMatch(svg, /<text|<script|<image|(?:href|style)=/);
    for (const color of svg.match(/#[a-f0-9]{6}\b/g) ?? []) assert.ok(known.has(color), `${id} uses a color outside the palette: ${color}`);
  }
  for (const associations of maps) {
    for (const key of Object.keys(associations)) {
      assert.equal(key, key.toLowerCase());
      assert.doesNotMatch(key, /[*?\\]/);
    }
  }
  for (const extension of Object.keys(theme.fileExtensions)) assert.ok(!extension.startsWith("."));
});

test("folder roles reuse the intellij artwork and retain explicit expanded and root fallbacks", () => {
  assert.equal(theme.folder, "folder-folder");
  assert.equal(theme.folderExpanded, theme.folder);
  assert.equal(theme.rootFolder, "folder-project");
  assert.equal(theme.rootFolderExpanded, theme.rootFolder);
  assert.deepEqual(theme.folderNamesExpanded, theme.folderNames);
  for (const folder of folderDefinitions) {
    const svg = output.get(`${base}/folder-${folder.name}.svg`);
    if (svg) assert.equal(svg, folderSvg(palette.colors, folder), `folder geometry drifted: ${folder.name}`);
  }
  assert.equal(theme.folderNames.src, "folder-source");
  assert.equal(theme.folderNames.tests, "folder-test");
  assert.equal(theme.folderNames.node_modules, "folder-library");
});

function resolve(filename: string, language: string): string {
  const lower = filename.toLowerCase();
  if (theme.fileNames[lower]) return theme.fileNames[lower];
  const segments = lower.split(".");
  for (let index = 1; index < segments.length; index++) {
    const matched = theme.fileExtensions[segments.slice(index).join(".")];
    if (matched) return matched;
  }
  return theme.languageIds[language] ?? theme.file;
}

test("specific filenames and compound extensions preserve useful file roles", () => {
  const examples: [string, string, string][] = [
    ["DocumentController.java", "java", "java"],
    ["app.ts", "typescript", "typescript"],
    ["app.test.ts", "typescript", "test"],
    ["types.d.ts", "typescript", "typescript"],
    ["vite.config.ts", "typescript", "typescript"],
    ["package.json", "json", "config"],
    ["package-lock.json", "json", "lock"],
    ["pnpm-lock.yaml", "yaml", "lock"],
    ["Gemfile", "ruby", "ruby"],
    ["LICENSE.md", "markdown", "license"],
    ["logo.svg", "xml", "image"],
    ["gradlew", "shellscript", "shell"],
    ["main", "python", "python"],
    ["custom.unrecognized", "custom-language", "file"],
  ];
  for (const [filename, language, role] of examples) assert.equal(resolve(filename, language), `file-${role}`, filename);
});
