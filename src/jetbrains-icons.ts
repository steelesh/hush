import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { load } from "./palette.ts";
import { jetbrains } from "./targets/jetbrains/index.ts";

const root = fileURLToPath(new URL("../", import.meta.url));
const app = process.env.SOTTO_IDEA_CONTENTS ?? "/Applications/IntelliJ IDEA.app/Contents";
const product = JSON.parse(readFileSync(join(app, "Resources/product-info.json"), "utf8"));
const plugins = process.env.SOTTO_IDEA_PLUGINS ?? join(process.env.HOME ?? "", "Library/Application Support/JetBrains", product.dataDirectoryName, "plugins");
const java = join(app, "jbr/Contents/Home/bin/java");
if (!existsSync(java)) throw new Error(`no bundled Java runtime at ${java}`);
const dist = join(root, "dist");
mkdirSync(dist, { recursive: true });
const stage = mkdtempSync(join(dist, ".sotto-icons-"));
try {
  const palette = load();
  const resources = join(stage, "resources");
  const inventory = join(stage, "inventory");
  const normalized = join(stage, "normalized");
  for (const file of jetbrains.files(palette)) {
    const destination = join(resources, file.path.replace(/^themes\/jetbrains\//, ""));
    mkdirSync(dirname(destination), { recursive: true });
    writeFileSync(destination, file.content);
  }
  execFileSync("python3", [join(root, "scripts/jetbrains-icon-inventory.py"), "--app", app, "--plugins", plugins, "--output", inventory], { stdio: "inherit" });
  execFileSync("python3", [join(root, "scripts/jetbrains-icon-colors.py"), join(inventory, "manifest.json"), join(root, "palette.json"), normalized], {
    stdio: "inherit",
  });
  const paletteFile = join(stage, "palette.tsv");
  writeFileSync(
    paletteFile,
    Object.entries(palette.colors)
      .map(([name, hex]) => `${name}\t${hex}`)
      .join("\n"),
  );
  execFileSync(java, ["-Djava.awt.headless=true", join(root, "scripts/JetbrainsRasterIcons.java"), join(inventory, "sources"), normalized, paletteFile], {
    stdio: "inherit",
  });
  execFileSync("python3", [join(root, "scripts/jetbrains-icon-package.py"), inventory, normalized, resources], { stdio: "inherit" });
  const verification = join(stage, "icon-verification.json");
  execFileSync(
    java,
    [
      "-Djava.awt.headless=true",
      "-cp",
      join(app, "lib/*"),
      join(root, "scripts/VerifyJetbrainsIcons.java"),
      resources,
      join(stage, "icon-coverage.json"),
      verification,
      inventory,
    ],
    { stdio: "inherit" },
  );
  const lib = join(stage, "sotto/lib");
  mkdirSync(lib, { recursive: true });
  execFileSync("zip", ["-X", "-q", "-r", join(lib, "sotto.jar"), "."], { cwd: resources });
  const archive = join(stage, "sotto-jetbrains-icons.zip");
  execFileSync("zip", ["-X", "-q", "-r", archive, "sotto"], { cwd: stage });
  renameSync(archive, join(dist, "sotto-jetbrains-icons.zip"));
  renameSync(join(stage, "icon-coverage.json"), join(dist, "jetbrains-icon-coverage.json"));
  renameSync(verification, join(dist, "jetbrains-icon-verification.json"));
  console.log("dist/sotto-jetbrains-icons.zip, local installed icon library in Sotto colors");
  console.log("keep it local: it holds recolored JetBrains artwork that the MIT license here does not cover");
} finally {
  rmSync(stage, { recursive: true, force: true });
}
