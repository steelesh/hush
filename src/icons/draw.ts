import type { FileIcon, FolderIcon } from "./catalog.ts";
import { mark, place } from "./library.ts";

const shut = "M2.5 11.5v-7a1 1 0 0 1 1-1h2.6l1.5 1.5h4.9a1 1 0 0 1 1 1v5.5a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1Z";
const notched = "M13.5 6.5V6a1 1 0 0 0-1-1H7.6L6.1 3.5H3.5a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h3";

const frame = (body: string) => `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">${body}</svg>\n`;
const stroke = (path: string, color: string) => `<path d="${path}" fill="none" stroke="${color}" stroke-linecap="round" stroke-linejoin="round"/>`;

export function fileIcon(icon: FileIcon, color: string): string {
  return frame(place(mark(icon.source, icon.slug), color, 1.25, 1.25, 13.5));
}

export function folderIcon(outline: string, badge?: { icon: FolderIcon; color: string }): string {
  if (!badge) return frame(stroke(shut, outline));
  return frame(`${stroke(notched, outline)}${place(mark(badge.icon.source, badge.icon.slug), badge.color, 8, 8, 7.5)}`);
}
