import { readFileSync } from "node:fs";
import * as simple from "simple-icons";

export type Source = "simple" | "phosphor" | "devicon" | "sotto";
export type Mark = { left: number; top: number; wide: number; tall: number; path: string };
type Vendored = { devicon: Record<string, string>; sotto: Record<string, { view: [number, number, number, number]; path: string }> };

const branded = (value: unknown): value is simple.SimpleIcon => typeof value === "object" && value !== null && "slug" in value;
const brands = new Map(
  Object.values(simple)
    .filter(branded)
    .map((icon) => [icon.slug, icon]),
);
const glyphs = new URL("../../node_modules/@phosphor-icons/core/assets/fill/", import.meta.url);
const vendored = JSON.parse(readFileSync(new URL("../../data/marks.json", import.meta.url), "utf8")) as Vendored;
const square = (edge: number, inset = 0) => ({ left: inset, top: inset, wide: edge - 2 * inset, tall: edge - 2 * inset });

export function mark(source: Source, slug: string): Mark {
  if (source === "simple") {
    const brand = brands.get(slug);
    if (!brand) throw new Error(`icons: simple icons has no ${slug}`);
    return { ...square(24), path: brand.path };
  }
  if (source === "devicon") {
    const path = vendored.devicon[slug];
    if (!path) throw new Error(`icons: no vendored devicon mark ${slug}`);
    return { ...square(128), path };
  }
  if (source === "sotto") {
    const own = vendored.sotto[slug];
    if (!own) throw new Error(`icons: no sotto mark ${slug}`);
    const [left, top, wide, tall] = own.view;
    return { left, top, wide, tall, path: own.path };
  }
  const drawn = readFileSync(new URL(`${slug}-fill.svg`, glyphs), "utf8");
  const path = [...drawn.matchAll(/<path d="([^"]+)"/g)].map((match) => match[1]).join("");
  if (!path || /<(?!\/?(?:svg|path)\b)/.test(drawn)) throw new Error(`icons: phosphor ${slug} is not plain paths`);
  return { ...square(256, 24), path };
}

export function place(drawn: Mark, color: string, left: number, top: number, size: number): string {
  const scale = size / Math.max(drawn.wide, drawn.tall);
  const shift = (edge: number, start: number, span: number) => Number((edge + (size - span * scale) / 2 - start * scale).toFixed(4));
  const move = `translate(${shift(left, drawn.left, drawn.wide)} ${shift(top, drawn.top, drawn.tall)}) scale(${Number(scale.toFixed(6))})`;
  return `<path d="${drawn.path}" fill="${color}" transform="${move}"/>`;
}

export function spaced(path: string): string {
  const number = /[-+]?(?:\d*\.\d+|\d+\.?)(?:e[-+]?\d+)?/iy;
  let out = "";
  let command = "";
  let count = 0;
  let at = 0;
  while (at < path.length) {
    const char = path.charAt(at);
    if (/[\s,]/.test(char)) {
      at++;
      continue;
    }
    if (/[a-df-z]/i.test(char)) {
      command = char;
      count = 0;
      out += char;
      at++;
      continue;
    }
    let token = char;
    if (command.toLowerCase() === "a" && (count % 7 === 3 || count % 7 === 4)) {
      at++;
    } else {
      number.lastIndex = at;
      const match = number.exec(path);
      if (!match) throw new Error(`icons: unreadable path near ${path.slice(at, at + 12)}`);
      token = match[0];
      at = number.lastIndex;
    }
    out += `${count > 0 ? " " : ""}${token}`;
    count++;
  }
  return out;
}
