import { readFileSync } from "node:fs";
import { type Name, names } from "../palette.ts";
import type { Source } from "./library.ts";

export type FileIcon = { name: string; source: Source; slug: string; tone: Name; extensions?: string[]; filenames?: string[]; languages?: string[] };
export type FolderIcon = { name: string; source: Source; slug: string; tone: Name; names: string[] };
type Catalog = { files: FileIcon[]; folders: FolderIcon[] };

const catalog = JSON.parse(readFileSync(new URL("../../data/icons.json", import.meta.url), "utf8")) as Catalog;

for (const [kind, entries] of Object.entries(catalog)) {
  const seen = new Set<string>();
  for (const entry of entries) {
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(entry.name)) throw new Error(`icons: ${kind} name is not kebab case: ${entry.name}`);
    if (seen.has(entry.name)) throw new Error(`icons: duplicate ${kind} name ${entry.name}`);
    if (!names.includes(entry.tone)) throw new Error(`icons: ${entry.name} has no palette tone ${entry.tone}`);
    seen.add(entry.name);
  }
}
if (!catalog.files.some((file) => file.name === "file")) throw new Error("icons: the catalog has no default file");

export const { files, folders } = catalog;
