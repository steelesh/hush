import { readFileSync } from "node:fs";
import { files } from "../../icons/catalog.ts";
import { fileIcon } from "../../icons/draw.ts";
import type { Colors, Name } from "../../palette.ts";
import type { File } from "../../target.ts";

type Folder = {
  name: string;
  stroke: Name;
  fill: Name;
  glyph: string;
  paths: readonly string[];
  layer?: "module" | "source";
};

const code = '<path d="m6.5 8-1.5 1.5 1.5 1.5m3-3 1.5 1.5-1.5 1.5"/>';
const check = '<path d="m5.5 9.5 1.5 1.5 3.5-3.5"/>';
const diamond = '<path d="m8 7.5 2 2-2 2-2-2Z"/>';
const books = '<path d="M5.5 8v3m2-3v3m2-3 1 3"/>';
const spark = '<path d="M7.5 7.5v4m-2-2h4m-3.4-1.4 2.8 2.8m0-2.8-2.8 2.8"/>';
const globe = '<circle cx="8" cy="9.5" r="2.5"/><path d="M5.5 9.5h5M8 7c-1.5 1.5-1.5 3.5 0 5m0-5c1.5 1.5 1.5 3.5 0 5"/>';
const project = '<rect x="9.5" y="9.5" width="6" height="6" rx="1.5" fill="currentColor" fill-opacity=".12"/>';

export const folderDefinitions: readonly Folder[] = [
  { name: "folder", stroke: "rest", fill: "tint_change", glyph: "", paths: ["nodes/folder.svg", "expui/nodes/folder.svg"] },
  {
    name: "package",
    stroke: "rest",
    fill: "tint_change",
    glyph: '<circle cx="8" cy="9.5" r="1.5"/>',
    paths: ["nodes/package.svg", "expui/nodes/package.svg"],
  },

  { name: "project", stroke: "cue", fill: "tint_change", glyph: project, paths: ["nodes/Module.svg", "actions/moduleDirectory.svg", "expui/nodes/module.svg"] },
  {
    name: "module-group",
    stroke: "cue",
    fill: "tint_change",
    glyph: '<rect x="5.5" y="7.5" width="2" height="2"/><rect x="8.5" y="7.5" width="2" height="2"/><path d="M6.5 11.5h3"/>',
    paths: ["nodes/moduleGroup.svg", "expui/nodes/moduleGroup.svg"],
  },
  {
    name: "java-module",
    stroke: "cue",
    fill: "tint_change",
    glyph: '<path d="M5.5 7.5h4v2a2 2 0 0 1-4 0Zm4 .5a1 1 0 0 1 0 2"/>',
    paths: ["nodes/javaModule.svg", "expui/nodes/moduleJava.svg"],
  },
  {
    name: "unloaded",
    stroke: "breath",
    fill: "near",
    glyph: '<path d="m6 7.5 4 4m0-4-4 4"/>',
    paths: ["modules/unloadedModule.svg", "expui/nodes/unloadedModule.svg"],
  },
  { name: "source", stroke: "cue", fill: "tint_change", glyph: code, paths: ["modules/sourceRoot.svg", "expui/nodes/sourceRoot.svg"] },
  { name: "test", stroke: "grown", fill: "tint_add", glyph: check, paths: ["modules/testRoot.svg", "expui/nodes/testRoot.svg"] },
  {
    name: "test-source",
    stroke: "grown",
    fill: "tint_add",
    glyph: '<path d="m6.5 8-1.5 1.5 1.5 1.5m1.5-1 1 1 2-3"/>',
    paths: ["nodes/testSourceFolder.svg", "expui/nodes/testSourceFolder.svg"],
  },
  { name: "excluded", stroke: "said", fill: "tint_search", glyph: '<path d="M6 9.5h4"/>', paths: ["modules/excludeRoot.svg", "expui/nodes/excludeRoot.svg"] },
  { name: "resources", stroke: "nudge", fill: "tint_change", glyph: diamond, paths: ["modules/resourcesRoot.svg", "expui/nodes/resourcesRoot.svg"] },
  {
    name: "test-resources",
    stroke: "grown",
    fill: "tint_add",
    glyph: '<path d="m6.5 8 1.5 1.5-1.5 1.5L5 9.5Zm2 2 1 1 2-3"/>',
    paths: ["modules/testResourcesRoot.svg", "expui/nodes/testResourcesRoot.svg"],
  },
  {
    name: "generated",
    stroke: "murmur",
    fill: "near",
    glyph: spark,
    paths: ["actions/generatedFolder.svg", "modules/generatedFolder.svg", "expui/nodes/generated.svg"],
  },
  {
    name: "generated-source",
    stroke: "cue",
    fill: "tint_change",
    glyph: '<path d="M6.5 7.5v4m-2-2h4m1.5-1.5 1.5 1.5-1.5 1.5"/>',
    paths: ["modules/generatedSourceRoot.svg", "expui/nodes/generatedSource.svg"],
  },
  {
    name: "generated-test",
    stroke: "grown",
    fill: "tint_add",
    glyph: '<path d="M6.5 7.5v4m-2-2h4m1 .5.75.75 1.25-2"/>',
    paths: ["modules/generatedTestRoot.svg", "expui/nodes/generatedTestRoot.svg"],
  },
  {
    name: "generated-excluded",
    stroke: "said",
    fill: "tint_search",
    glyph: '<path d="M6.5 7.5v4m-2-2h4m-3.4-1.4 2.8 2.8m0-2.8-2.8 2.8m4.9-1.4h1.5"/>',
    paths: ["modules/excludedGeneratedRoot.svg", "expui/nodes/excludedGenerated.svg"],
  },
  { name: "library", stroke: "cue", fill: "tint_change", glyph: books, paths: ["nodes/ppLibFolder.svg", "expui/nodes/libraryFolder.svg"] },
  {
    name: "native-library",
    stroke: "cue",
    fill: "tint_change",
    glyph: '<rect x="5.5" y="7.5" width="4" height="4" rx=".5"/><path d="M4.5 8.5h1m-1 2h1m4-2h1m-1 2h1"/>',
    paths: ["nodes/nativeLibrariesFolder.svg", "expui/nodes/nativeLibrariesFolder.svg"],
  },
  {
    name: "compiled",
    stroke: "form",
    fill: "tint_add",
    glyph: '<path d="M5.5 7.5h2v2h-2Zm3 0h2v2h-2Zm-3 4h5"/>',
    paths: ["nodes/compiledClassesFolder.svg", "expui/nodes/compiledClassesFolder.svg"],
  },
  {
    name: "home",
    stroke: "rest",
    fill: "tint_change",
    glyph: '<path d="m4.5 9.5 3-2.5 3 2.5m-5-.5v2.5h4V9"/>',
    paths: ["nodes/homeFolder.svg", "expui/nodes/homeFolder.svg"],
  },
  {
    name: "docs",
    stroke: "said",
    fill: "tint_search",
    glyph: '<path d="M5.5 7.5h5v4h-5Zm1.5 2h2"/>',
    paths: ["nodes/javaDocFolder.svg", "expui/nodes/javaDocFolder.svg"],
  },
  { name: "log", stroke: "murmur", fill: "near", glyph: '<path d="M5.5 7.5h5m-5 2h5m-5 2h3"/>', paths: ["nodes/logFolder.svg", "expui/nodes/logFolder.svg"] },
  {
    name: "annotation",
    stroke: "nudge",
    fill: "tint_change",
    glyph: '<path d="m5.5 11.5 2-4 2 4M6 10.5h3"/>',
    paths: ["modules/annotation.svg", "expui/nodes/annotationFolder.svg"],
  },
  {
    name: "template",
    stroke: "nudge",
    fill: "tint_change",
    glyph: '<path d="M5.5 7.5h4m-2 0v4m-1.5 0h3"/>',
    paths: ["nodes/templateRoot.svg", "expui/nodes/templateRoot.svg"],
  },
  { name: "web", stroke: "rest", fill: "tint_change", glyph: globe, paths: ["nodes/webFolder.svg", "expui/nodes/webFolder.svg"] },
  {
    name: "unmark-web",
    stroke: "breath",
    fill: "near",
    glyph: `${globe}<path d="m5.5 12 5-5"/>`,
    paths: ["modules/unmarkWebroot.svg", "expui/nodes/unmarkWebRoot.svg"],
  },
  {
    name: "github",
    stroke: "rest",
    fill: "tint_change",
    glyph:
      '<circle cx="5.5" cy="7.5" r=".75"/><circle cx="5.5" cy="11.5" r=".75"/><circle cx="10.5" cy="7.5" r=".75"/><path d="M5.5 8.5v2m5-2v.5c0 1-5 1-5 1"/>',
    paths: ["expui/nodes/folderGithub.svg"],
  },
  { name: "config", stroke: "murmur", fill: "near", glyph: '<path d="M6.5 7.5v4m3-4v4m-4-3h2m1 2h2"/>', paths: ["nodes/configFolder.svg"] },
  {
    name: "copy",
    stroke: "rest",
    fill: "tint_change",
    glyph: '<path d="M5.5 7.5h3v3h-3Zm2 1h3v3h-3Z"/>',
    paths: ["nodes/copyOfFolder.svg", "vcs/folders.svg", "expui/nodes/copyOfFolder.svg"],
  },
  {
    name: "edit",
    stroke: "rest",
    fill: "tint_change",
    glyph: '<path d="m5.5 10 3-3 1.5 1.5-3 3H5.5Zm2-2 1.5 1.5"/>',
    paths: ["modules/editFolder.svg", "expui/nodes/editFolder.svg"],
  },
  {
    name: "extracted",
    stroke: "cue",
    fill: "tint_change",
    glyph: '<path d="m6 8.5-1.5 1 1.5 1m3-2 1.5 1-1.5 1m-1.5-2.5v3"/>',
    paths: ["nodes/extractedFolder.svg", "expui/nodes/extractedFolder.svg"],
  },
  {
    name: "up",
    stroke: "rest",
    fill: "tint_change",
    glyph: '<path d="M7.5 11.5v-4m-2 2 2-2 2 2"/>',
    paths: ["nodes/upFolder.svg", "expui/nodes/upFolder.svg"],
  },
  {
    name: "new",
    stroke: "grown",
    fill: "tint_add",
    glyph: '<path d="M7.5 7.5v4m-2-2h4"/>',
    paths: ["actions/newFolder.svg", "toolbarDecorator/addFolder.svg", "expui/actions/newFolder.svg"],
  },
  {
    name: "add-excluded",
    stroke: "said",
    fill: "tint_search",
    glyph: '<path d="M6.5 7.5v4m-2-2h4m1.5 0h1.5"/>',
    paths: ["modules/addExcludedRoot.svg", "expui/actions/addExcludedRoot.svg"],
  },
  { name: "module-layer", stroke: "cue", fill: "tint_change", glyph: "", paths: ["expui/nodes/module8x8.svg"], layer: "module" },
  {
    name: "source-layer",
    stroke: "cue",
    fill: "tint_change",
    glyph: "",
    paths: ["modules/sourceRootFileLayer.svg", "expui/nodes/sourceRootFileLayer.svg"],
    layer: "source",
  },
];

export function folderReplacements(): Record<string, string> {
  return Object.fromEntries(folderDefinitions.flatMap((folder) => folder.paths.map((path) => [`/${path}`, `/icons/sotto/folders/${folder.name}.svg`])));
}

export function folderSvg(colors: Colors, folder: Folder): string {
  const stroke = colors[folder.stroke];
  const fill = colors[folder.fill];
  const size = folder.layer === "module" ? 8 : 16;
  const base = folder.layer
    ? `<rect x=".5" y=".5" width="${folder.layer === "module" ? 7 : 6}" height="${folder.layer === "module" ? 7 : 6}" rx="1.5" fill="${fill}" stroke="${stroke}"/>`
    : `<path d="M1.5 5V3.5a1 1 0 0 1 1-1h3.1a1 1 0 0 1 .7.3l1.7 1.7H13.5a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1Z" fill="${fill}" stroke="${stroke}" stroke-linejoin="round"/><path d="M2 5.5h12" stroke="${stroke}" stroke-opacity=".45"/>`;
  const glyph = folder.glyph.replaceAll('fill="currentColor" fill-opacity=".12"', `fill="${fill}"`);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${base}<g stroke="${stroke}" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" fill="none">${glyph}</g></svg>\n`;
}

export function folderIcons(colors: Colors): File[] {
  return folderDefinitions.map((folder) => ({ path: `themes/jetbrains/icons/sotto/folders/${folder.name}.svg`, content: folderSvg(colors, folder) }));
}

type Mapped = { platform: Record<string, string>; plugins: Record<string, Record<string, string>> };

const mapped = JSON.parse(readFileSync(new URL("../../../data/jetbrains-icons.json", import.meta.url), "utf8")) as Mapped;
const drawn = new Map(files.map((icon) => [icon.name, icon]));
const target = (name: string) => {
  if (!drawn.has(name)) throw new Error(`jetbrains icons: the catalog has no ${name}`);
  return `/icons/sotto/files/${name}.svg`;
};
const targets = (paths: Record<string, string>) => Object.fromEntries(Object.entries(paths).map(([path, name]) => [path, target(name)]));

export function fileReplacements(): Record<string, string | Record<string, string>> {
  return { ...targets(mapped.platform), ...Object.fromEntries(Object.entries(mapped.plugins).map(([plugin, paths]) => [plugin, targets(paths)])) };
}

export function fileIcons(colors: Colors): File[] {
  const used = new Set([mapped.platform, ...Object.values(mapped.plugins)].flatMap(Object.values));
  return [...used].sort().flatMap((name) => {
    const icon = drawn.get(name);
    return icon ? [{ path: `themes/jetbrains/icons/sotto/files/${name}.svg`, content: fileIcon(icon, colors[icon.tone]) }] : [];
  });
}
