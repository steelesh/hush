import { readFileSync } from "node:fs";
import { fileExtensions, fileNames, folderNames } from "../icons/associations.ts";
import { type FolderIcon, files, folders } from "../icons/catalog.ts";
import { mark, place } from "../icons/library.ts";
import { notice } from "../icons/notice.ts";
import { order, resolveFile, resolveFolder } from "../icons/resolve.ts";
import type { Colors, Name } from "../palette.ts";
import type { File, Target } from "../target.ts";
import { lines } from "../text.ts";

const base = "themes/jetbrains-icons";
const fixture = "jetbrains-icons/src/test/resources/conformance.tsv";
const body = "M1.5 5V3.5a1 1 0 0 1 1-1h3.1a1 1 0 0 1 .7.3l1.7 1.7H13.5a1 1 0 0 1 1 1v1H7v7H2.5a1 1 0 0 1-1-1Z";
const edge = "M14.5 6.5v-1a1 1 0 0 0-1-1H8L6.3 2.8a1 1 0 0 0-.7-.3H2.5a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h4";
const outline: Name = "rest";
const quiet: Name = "breath";

export const iconVariants: { folder: string; paint: (tone: Name) => Name }[] = [
  { folder: "color", paint: (tone) => tone },
  { folder: "quiet", paint: () => quiet },
];

function folder(colors: Colors, icon: FolderIcon, tone: Name): string {
  const line = colors[outline];
  const shell = `<path d="${body}" fill="${colors.tint_change}"/><path d="${edge}" fill="none" stroke="${line}" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 5.5h12" stroke="${line}" stroke-opacity=".45"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">${shell}${place(mark(icon.source, icon.slug), colors[tone], 8, 8, 7.5)}</svg>\n`;
}

const table = (entries: Record<string, string>) =>
  lines(
    Object.entries(entries)
      .sort(([left], [right]) => (left < right ? -1 : 1))
      .map(([key, icon]) => `${key}\t${icon}`),
  );

const split = (key: string): [parent: string, name: string] => {
  const at = key.lastIndexOf("/");
  return at < 0 ? ["", key] : [key.slice(0, at), key.slice(at + 1)];
};

function samples(): [kind: string, parent: string, name: string][] {
  const named = Object.keys(fileNames).flatMap((key): [string, string, string][] => {
    const [parent, name] = split(key);
    return [
      ["file", parent || "project", name],
      ["file", "elsewhere", name.toUpperCase()],
    ];
  });
  const extended = Object.keys(fileExtensions).flatMap((key): [string, string, string][] => {
    const [parent, extension] = split(key);
    return [
      ["file", parent || "project", `sample.${extension}`],
      ["file", parent || "project", `.${extension}`],
      ["file", "elsewhere", `Sample.Extra.${extension.toUpperCase()}`],
    ];
  });
  const directories = Object.keys(folderNames).flatMap((key): [string, string, string][] => {
    const [parent, name] = split(key);
    return [
      ["folder", parent || "project", name],
      ["folder", "elsewhere", name.toUpperCase()],
    ];
  });
  const edges: [string, string, string][] = [
    ["file", "", "Makefile"],
    ["file", "project", "unknown.zzzzzz"],
    ["file", "project", "noextension"],
    ["file", "project", "trailing."],
    ["file", "project", "a.b.c.d.e.ts"],
    ["file", "project", "my file.txt"],
    ["file", "project", `${"q".repeat(252)}.ts`],
    ["file", "project", `${"q".repeat(253)}.ts`],
    ["file", "workflows", "deploy.compose.yml"],
    ["file", ".vscode", "editor.schema.json"],
    ["file", ".storybook", "button.test.ts"],
    ["file", ".github", "release.yml"],
    ["folder", "", "src"],
    ["folder", "project", "src.old"],
    ["folder", "project", "nothing-claims-this"],
  ];
  return [...named, ...extended, ...directories, ...edges];
}

const conformance = () =>
  lines(
    samples().map(([kind, parent, name]) => {
      const icon = kind === "file" ? resolveFile(parent || undefined, name) : resolveFolder(parent || undefined, name);
      return [kind, parent, name, icon ?? ""].join("\t");
    }),
  );

export function jetbrainsIconFiles(colors: Colors): File[] {
  const clash = files.find((icon) => icon.name.startsWith("folder"));
  if (clash) throw new Error(`jetbrains icons: file icon ${clash.name} would be packaged as a folder icon`);
  return [
    ...iconVariants.flatMap((variant) =>
      folders.map((icon) => ({ path: `${base}/icons/folders/${variant.folder}/${icon.name}.svg`, content: folder(colors, icon, variant.paint(icon.tone)) })),
    ),
    { path: `${base}/tables/file-names.tsv`, content: table(fileNames) },
    { path: `${base}/tables/file-extensions.tsv`, content: table(fileExtensions) },
    { path: `${base}/tables/folder-names.tsv`, content: table(folderNames) },
    { path: `${base}/tables/order.tsv`, content: lines(order.filter((icon) => !icon.startsWith("folder-"))) },
    { path: `${base}/LICENSE`, content: readFileSync(new URL("../../LICENSE", import.meta.url), "utf8") },
    { path: `${base}/NOTICE`, content: notice },
    { path: fixture, content: conformance() },
  ];
}

export const jetbrainsIcons: Target = { name: "jetbrains-icons", files: (palette) => jetbrainsIconFiles(palette.colors) };
