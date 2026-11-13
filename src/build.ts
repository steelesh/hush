import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { load } from "./palette.ts";
import type { File, Target } from "./target.ts";
import { targets } from "./targets/index.ts";

const root = fileURLToPath(new URL("..", import.meta.url));
const owned = "themes";
const ignored = [".DS_Store"];
const unresolved = /\bundefined\b|\bNaN\b|\[object Object\]/;

const listed = (title: string, paths: string[]) => [title, ...paths.map((path) => `  ${path}`)].join("\n");
const counted = (files: Map<string, string>) => `${files.size} generated ${files.size === 1 ? "file" : "files"}`;

function chosen(names: string[]): Target[] {
  const known = targets.map((target) => target.name);
  const unknown = names.find((name) => !known.includes(name));
  if (unknown?.startsWith("-")) throw new Error(`unknown option ${unknown}, the only option is --check`);
  if (unknown) throw new Error(`unknown target ${unknown}, expected one of: ${known.join(", ")}`);
  return names.length > 0 ? targets.filter((target) => names.includes(target.name)) : targets;
}

function placed(target: Target, file: File): string {
  const path = relative(root, join(root, file.path));
  if (isAbsolute(file.path) || path === "" || path.startsWith("..")) throw new Error(`${target.name} writes outside the repository: ${file.path}`);
  for (const [index, text] of file.content.split("\n").entries()) {
    if (unresolved.test(text)) throw new Error(`${target.name} left an unresolved value in ${path}:${index + 1}: ${text.trim()}`);
  }
  return path;
}

function generate(from: Target[]): Map<string, string> {
  const palette = load();
  const files = new Map<string, string>();
  const writers = new Map<string, string>();
  for (const target of from) {
    for (const file of target.files(palette)) {
      const path = placed(target, file);
      const other = writers.get(path);
      if (other) throw new Error(`${path} is written by both ${other} and ${target.name}`);
      writers.set(path, target.name);
      files.set(path, file.content);
    }
  }
  return files;
}

function strays(files: Map<string, string>): string[] {
  if (!existsSync(join(root, owned))) return [];
  return readdirSync(join(root, owned), { recursive: true, withFileTypes: true })
    .filter((entry) => !entry.isDirectory() && !ignored.includes(entry.name))
    .map((entry) => relative(root, join(entry.parentPath, entry.name)))
    .filter((path) => !files.has(path))
    .sort();
}

function run(args: string[]): number {
  const check = args.includes("--check");
  const only = args.filter((arg) => arg !== "--check");
  const files = generate(chosen(only));
  const stale = [...files].filter(([path, content]) => !existsSync(join(root, path)) || readFileSync(join(root, path), "utf8") !== content);
  const changed = stale.map(([path]) => path);
  const unowned = only.length === 0 ? strays(files) : [];

  if (check) {
    if (changed.length > 0) console.error(listed("out of date, run the build:", changed));
    if (unowned.length > 0) console.error(listed(`under ${owned}/ but written by no target, the build removes these:`, unowned));
    if (changed.length + unowned.length > 0) return 1;
    console.log(`${counted(files)}, all current`);
    return 0;
  }

  for (const [path, content] of stale) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), content);
  }
  for (const path of unowned) rmSync(join(root, path));
  if (changed.length > 0) console.log(listed("written:", changed));
  if (unowned.length > 0) console.log(listed("removed:", unowned));
  console.log(`${counted(files)}, ${changed.length} written, ${unowned.length} removed`);
  return 0;
}

try {
  process.exitCode = run(process.argv.slice(2));
} catch (error) {
  console.error(`build: ${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
}
