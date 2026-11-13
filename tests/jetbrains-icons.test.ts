import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import { load } from "../src/palette.ts";
import { folderDefinitions, folderIcons, folderReplacements } from "../src/targets/jetbrains/icons.ts";

const files = folderIcons(load().colors);
const replacements = folderReplacements();

test("every folder path resolves to one generated vector asset", () => {
  const paths = folderDefinitions.flatMap((folder) => folder.paths);
  assert.equal(paths.length, new Set(paths).size);
  assert.equal(Object.keys(replacements).length, paths.length);
  for (const path of Object.values(replacements))
    assert.ok(
      files.some((file) => file.path === `themes/jetbrains${path}`),
      path,
    );
  for (const file of files) {
    const parsed = spawnSync("xmllint", ["--noout", "-"], { input: file.content, encoding: "utf8" });
    assert.equal(parsed.status, 0, `${file.path}: ${parsed.stderr}`);
    assert.doesNotMatch(file.content, /<text|<image|currentColor/);
  }
});

test("folder roles have distinct geometry and preserve the small overlay canvases", () => {
  const shapes = files.map((file) => file.content.replace(/#[0-9a-f]{6}/g, "color"));
  assert.equal(shapes.length, new Set(shapes).size);
  const module = files.find((file) => file.path.endsWith("/module-layer.svg"));
  const source = files.find((file) => file.path.endsWith("/source-layer.svg"));
  assert.match(module?.content ?? "", /width="8" height="8"/);
  assert.match(source?.content ?? "", /width="16" height="16"/);
  assert.doesNotMatch(module?.content ?? "", /M1\.5 5V3\.5/);
  assert.doesNotMatch(source?.content ?? "", /M1\.5 5V3\.5/);
});
