import { files, folders } from "./catalog.ts";

function claimed<Entry extends { name: string }>(entries: readonly Entry[], kind: string, keys: (entry: Entry) => readonly string[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const entry of entries) {
    for (const key of keys(entry)) {
      if (result[key]) throw new Error(`icons: ${kind} ${key} is claimed by both ${result[key]} and ${entry.name}`);
      result[key] = entry.name;
    }
  }
  return result;
}

export const fileNames = claimed(files, "filename", (icon) => icon.filenames ?? []);
export const fileExtensions = claimed(files, "extension", (icon) => icon.extensions ?? []);
export const languageIds = claimed(files, "language", (icon) => icon.languages ?? []);
export const folderNames = claimed(folders, "folder", (icon) => icon.names);
