import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { load } from "./palette.ts";
import { iconSheet } from "./targets/vscode-icons.ts";

const svg = iconSheet(load().colors);
const digest = createHash("sha256").update(svg).digest("hex");
const out = fileURLToPath(new URL("../assets/icons.png", import.meta.url));
const png = ["-depth", "8", "-alpha", "off", "-define", "png:compression-level=9", "-define", "png:exclude-chunks=date,time"];
execFileSync("magick", ["-density", "192", "svg:-", ...png, "-set", "comment", digest, out], { input: svg });
console.log(`assets/icons.png, ${digest.slice(0, 12)}`);
