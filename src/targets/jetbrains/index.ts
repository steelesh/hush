import { readFileSync } from "node:fs";
import meta from "../../../package.json" with { type: "json" };
import { notice } from "../../icons/notice.ts";
import type { Colors, Palette } from "../../palette.ts";
import type { Target } from "../../target.ts";
import { lines, xml } from "../../text.ts";
import { variants } from "../../variant.ts";
import { fileIcons, folderIcons } from "./icons.ts";
import { scheme } from "./scheme.ts";
import { theme } from "./theme.ts";

const id = "dev.steelesh.sotto";
const sinceBuild = "261";

const descriptor = (palette: Palette) =>
  lines([
    "<idea-plugin>",
    `  <id>${id}</id>`,
    "  <name>Sotto</name>",
    `  <version>${xml(meta.version)}</version>`,
    `  <vendor url="${xml(meta.homepage)}">steelesh</vendor>`,
    `  <description>${xml(`<p>${meta.description.replace(/\.$/, "")} for JetBrains IDEs.</p><p>For file and folder icons in the same palette, add the companion <b>Sotto Icons</b> plugin.</p>`)}</description>`,
    `  <idea-version since-build="${sinceBuild}" />`,
    "  <depends>com.intellij.modules.platform</depends>",
    `  <extensions defaultExtensionNs="com.intellij">`,
    ...variants(palette).map(({ file }) => `    <themeProvider id="dev.steelesh.${file.replace("-", ".")}" path="/${file}.theme.json" />`),
    "  </extensions>",
    "</idea-plugin>",
  ]);

const icon = (c: Colors) =>
  lines([
    '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40">',
    `  <rect width="40" height="40" rx="9" fill="${c.still}"/>`,
    `  <rect x="10.5" y="10.5" width="5" height="19" rx="2.5" fill="${c.call}"/>`,
    `  <rect x="17.5" y="13.5" width="5" height="13" rx="2.5" fill="${c.said}"/>`,
    `  <rect x="24.5" y="16.5" width="5" height="7" rx="2.5" fill="${c.form}"/>`,
    "</svg>",
  ]);

export const jetbrains: Target = {
  name: "jetbrains",
  files: (palette) => [
    ...folderIcons(palette.colors),
    ...fileIcons(palette.colors),
    { path: "themes/jetbrains/LICENSE", content: readFileSync(new URL("../../../LICENSE", import.meta.url), "utf8") },
    { path: "themes/jetbrains/NOTICE", content: notice },
    { path: "themes/jetbrains/META-INF/plugin.xml", content: descriptor(palette) },
    { path: "themes/jetbrains/META-INF/pluginIcon.svg", content: icon(palette.colors) },
    ...variants(palette).flatMap((variant) => [
      { path: `themes/jetbrains/${variant.file}.theme.json`, content: theme(variant) },
      { path: `themes/jetbrains/${variant.file}.xml`, content: scheme(variant) },
    ]),
  ],
};
