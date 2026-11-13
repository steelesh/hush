import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { type Group, type Name, names, type Palette } from "../src/palette.ts";

export const root = fileURLToPath(new URL("..", import.meta.url));

const skipped = new Set([".git", ".DS_Store", "node_modules"]);

export function files(dir = ""): string[] {
  const full = join(root, dir);
  if (!existsSync(full)) return [];
  return readdirSync(full, { withFileTypes: true })
    .flatMap((entry) => {
      if (skipped.has(entry.name)) return [];
      const path = dir ? `${dir}/${entry.name}` : entry.name;
      if (entry.isDirectory()) return files(path);
      return entry.isFile() ? [path] : [];
    })
    .sort();
}

export function read(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

export function within(palette: Palette, group: Group): Name[] {
  return names.filter((name) => palette.groups[name] === group);
}

export function report(failures: string[]): string {
  return `\n${failures.join("\n")}`;
}

export type Floor = { pair: string; detail: string; measured: number; minimum: number };

const drift = 0.1;

export function floors(kind: string, tables: Record<string, Floor[]>, weaknesses: Record<string, number>) {
  const checked = Object.values(tables).flat();

  for (const [title, table] of Object.entries(tables)) {
    const tolerated = table.filter(({ pair }) => pair in weaknesses).length;
    const note = tolerated > 0 ? `, apart from ${tolerated} known ${tolerated === 1 ? "weakness" : "weaknesses"} listed below` : "";
    test(`${kind} floor: ${title}${note}`, () => {
      const failures = table.flatMap(({ pair, detail, measured, minimum }) => {
        const label = `${pair} (${detail}): ${kind} ${measured.toFixed(2)}`;
        const recorded = weaknesses[pair];
        if (measured >= minimum) return recorded === undefined ? [] : [`${label} now meets the floor of ${minimum}, remove it from the known weaknesses`];
        if (recorded === undefined) return [`${label} is under the floor of ${minimum}`];
        if (Math.abs(measured - recorded) <= drift) return [];
        return [`${label} is under the floor of ${minimum} and has moved more than ${drift} from the recorded ${recorded}, record the new value`];
      });
      assert.equal(failures.length, 0, report(failures));
    });
  }

  test(`every known ${kind} weakness names a pair that has a floor`, () => {
    const pairs = new Set(checked.map(({ pair }) => pair));
    const failures = Object.keys(weaknesses)
      .filter((pair) => !pairs.has(pair))
      .map((pair) => `${pair}: recorded as a known weakness but no floor checks it`);
    assert.equal(failures.length, 0, report(failures));
  });

  for (const { pair, measured, minimum } of checked) {
    if (pair in weaknesses) test.todo(`known weakness, not a pass: ${pair} has ${kind} ${measured.toFixed(2)}, under the floor of ${minimum}`);
  }
}
