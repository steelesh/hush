import { readFileSync } from "node:fs";

export const notice = [
  "The file icons here are drawn from three open icon sets.",
  "",
  "Simple Icons, https://simpleicons.org, released under CC0 1.0 Universal.",
  "The logos remain trademarks of their owners and appear only to identify the tools they belong to.",
  "",
  "Phosphor Icons, https://phosphoricons.com, released under the following license.",
  "",
  readFileSync(new URL("../../node_modules/@phosphor-icons/core/LICENSE", import.meta.url), "utf8")
    .replaceAll("\r\n", "\n")
    .trim(),
  "",
  "Devicon, https://devicon.dev, released under the following license.",
  "",
  readFileSync(new URL("../../data/marks.license", import.meta.url), "utf8")
    .replaceAll("\r\n", "\n")
    .trim(),
  "",
].join("\n");
