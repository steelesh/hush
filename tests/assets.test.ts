import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { inflateSync } from "node:zlib";
import { load, type Name } from "../src/palette.ts";
import { iconSheet } from "../src/targets/vscode-icons.ts";
import { root } from "./support.ts";

const palette = load();

function colors(path: string): Set<string> {
  const png = readFileSync(join(root, path));
  const width = png.readUInt32BE(16);
  const height = png.readUInt32BE(20);
  assert.equal(png[24], 8, `${path} is not 8 bit`);
  const channels = png[25] === 6 ? 4 : png[25] === 2 ? 3 : 0;
  assert.ok(channels && png[28] === 0, `${path} is not a plain rgb or rgba png`);
  const data: Buffer[] = [];
  for (let at = 8; at < png.length; at += 12 + png.readUInt32BE(at)) {
    if (png.toString("latin1", at + 4, at + 8) === "IDAT") data.push(png.subarray(at + 8, at + 8 + png.readUInt32BE(at)));
  }
  const raw = inflateSync(Buffer.concat(data));
  const stride = width * channels;
  const row = Buffer.alloc(stride);
  const above = Buffer.alloc(stride);
  const seen = new Set<number>();
  for (let y = 0; y < height; y++) {
    const filter = raw.readUInt8(y * (stride + 1));
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? row.readUInt8(x - channels) : 0;
      const b = above.readUInt8(x);
      const c = x >= channels ? above.readUInt8(x - channels) : 0;
      const p = a + b - c;
      const paeth = Math.abs(p - a) <= Math.abs(p - b) && Math.abs(p - a) <= Math.abs(p - c) ? a : Math.abs(p - b) <= Math.abs(p - c) ? b : c;
      row.writeUInt8((line.readUInt8(x) + ([0, a, b, (a + b) >> 1, paeth][filter] ?? 0)) & 255, x);
    }
    for (let x = 0; x < stride; x += channels) seen.add(row.readUIntBE(x, 3));
    row.copy(above);
  }
  return new Set([...seen].map((value) => `#${value.toString(16).padStart(6, "0")}`));
}

test("the hero is drawn in the current palette", () => {
  const drawn = colors("assets/hero.png");
  const roles: Name[] = ["pitch", "still", "room", "breath", "whisper", "murmur", "voice", "call", "said", "form", "rest", "aside", "flat", "grown"];
  for (const role of roles) assert.ok(drawn.has(palette.colors[role]), `assets/hero.png has no ${role} ${palette.colors[role]}: export it again from figma`);
});

test("the icon sheet is rendered from the current icons", () => {
  const digest = createHash("sha256").update(iconSheet(palette.colors)).digest("hex");
  assert.ok(readFileSync(join(root, "assets/icons.png")).includes(digest), "assets/icons.png is stale: run mise run sheet");
});
