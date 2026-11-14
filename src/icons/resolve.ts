import { fileExtensions, fileNames, folderNames, languageIds } from "./associations.ts";

type Table = Map<string, string>;

const limit = 255;
const shape = (text: string) => text.toLowerCase().replace(/\s/g, "/");
const keyed = (entries: Record<string, string>): Table => new Map(Object.entries(entries).map(([key, icon]) => [key.toLowerCase(), icon]));

const names = keyed(fileNames);
const extensions = keyed(fileExtensions);
const directories = keyed(folderNames);

export const order = [
  ...new Set([
    "file",
    ...Object.values(folderNames).map((icon) => `folder-${icon}`),
    ...Object.values(languageIds),
    ...Object.values(fileExtensions),
    ...Object.values(fileNames),
  ]),
];

const rank = new Map(order.map((icon, index) => [icon, index]));

function best(candidates: [icon: string | undefined, score: number][]): string | undefined {
  let winner: string | undefined;
  let high = -1;
  for (const [icon, score] of candidates) {
    if (!icon) continue;
    const total = score * order.length + (rank.get(icon) ?? 0);
    if (total > high) [winner, high] = [icon, total];
  }
  return winner;
}

export function resolveFile(parent: string | undefined, file: string): string | undefined {
  const name = shape(file);
  const above = parent ? shape(parent) : undefined;
  const segments = name.split(".");
  const short = name.length <= limit;
  const candidates: [string | undefined, number][] = [];
  if (short) {
    for (let index = 1; index < segments.length; index++) {
      const extension = segments.slice(index).join(".");
      const length = segments.length - index;
      candidates.push([extensions.get(extension), length + 3]);
      if (above) candidates.push([extensions.get(`${above}/${extension}`), length + 4]);
    }
  }
  if (short || segments.length === 1) {
    candidates.push([names.get(name), segments.length + 4]);
    if (above) candidates.push([names.get(`${above}/${name}`), segments.length + 5]);
  }
  return best(candidates);
}

export function resolveFolder(parent: string | undefined, folder: string): string | undefined {
  const name = shape(folder);
  return (parent ? directories.get(`${shape(parent)}/${name}`) : undefined) ?? directories.get(name);
}
