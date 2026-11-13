import type { Colors } from "../palette.ts";
import { type Rule, rules } from "../syntax.ts";
import type { Target } from "../target.ts";
import { lines } from "../text.ts";

const globals = (c: Colors): [string, string][] => [
  ["foreground", c.voice],
  ["lineHighlight", c.lull],
  ["gutterForeground", c.breath],
];

const pair = (indent: string, key: string, value: string) => [`${indent}<key>${key}</key>`, `${indent}<string>${value}</string>`];

const rule = ({ name, scopes, color, style }: Rule) => [
  "\t\t<dict>",
  ...pair("\t\t\t", "name", name),
  ...pair("\t\t\t", "scope", scopes.join(", ")),
  "\t\t\t<key>settings</key>",
  "\t\t\t<dict>",
  ...pair("\t\t\t\t", "foreground", color),
  ...(style ? pair("\t\t\t\t", "fontStyle", style) : []),
  "\t\t\t</dict>",
  "\t\t</dict>",
];

const theme = (c: Colors) =>
  lines([
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">',
    '<plist version="1.0">',
    "<dict>",
    ...pair("\t", "name", "hush"),
    "\t<key>settings</key>",
    "\t<array>",
    "\t\t<dict>",
    "\t\t\t<key>settings</key>",
    "\t\t\t<dict>",
    ...globals(c).flatMap(([key, value]) => pair("\t\t\t\t", key, value)),
    "\t\t\t</dict>",
    "\t\t</dict>",
    ...rules(c).flatMap(rule),
    "\t</array>",
    "</dict>",
    "</plist>",
  ]);

export const bat: Target = {
  name: "bat",
  files: ({ colors }) => [{ path: "themes/bat/hush.tmTheme", content: theme(colors) }],
};
