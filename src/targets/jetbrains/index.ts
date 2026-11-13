import meta from "../../../package.json" with { type: "json" };
import type { Colors } from "../../palette.ts";
import type { Target } from "../../target.ts";
import { lines, xml } from "../../text.ts";
import { scheme } from "./scheme.ts";
import { theme } from "./theme.ts";

const id = "dev.steelesh.hush";
const sinceBuild = "261";

const descriptor = lines([
  "<idea-plugin>",
  `  <id>${id}</id>`,
  "  <name>hush</name>",
  `  <version>${xml(meta.version)}</version>`,
  `  <vendor url="${xml(meta.repository.url)}">steelesh</vendor>`,
  `  <description>${xml(meta.description)} the interface, the editor scheme and the console colors come from one palette.</description>`,
  `  <idea-version since-build="${sinceBuild}" />`,
  "  <depends>com.intellij.modules.platform</depends>",
  `  <extensions defaultExtensionNs="com.intellij">`,
  `    <themeProvider id="${id}" path="/hush.theme.json" />`,
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
    { path: "themes/jetbrains/META-INF/plugin.xml", content: descriptor },
    { path: "themes/jetbrains/META-INF/pluginIcon.svg", content: icon(palette.colors) },
    { path: "themes/jetbrains/hush.theme.json", content: theme(palette) },
    { path: "themes/jetbrains/hush.xml", content: scheme(palette) },
  ],
};
