import type { Colors, Name } from "../palette.ts";
import type { Target } from "../target.ts";

type Style = { fg?: Name; bg?: Name; bold?: true; underline?: true };

const sections: Record<string, Record<string, Style>> = {
  styles: {
    identifier: { fg: "voice" },
    text: { fg: "voice", bg: "pitch" },
    "alt-text": { bg: "lull" },
    "selected-text": { bg: "held" },
    "fuzzy-match": { fg: "call", bold: true },
    ok: { fg: "grown" },
    info: { fg: "cue" },
    warning: { fg: "flat" },
    error: { fg: "sharp" },
    hidden: { fg: "whisper" },
    "cursor-line": { bg: "near", bold: true },
    "disabled-cursor-line": { bg: "lull" },
    "time-column": { fg: "breath", bg: "pitch" },
    "adjusted-time": { fg: "form" },
    "skewed-time": { fg: "flat" },
    "offset-time": { fg: "aside" },
    "file-offset": { fg: "breath" },
    "invalid-msg": { fg: "flat" },
    focused: { fg: "voice", bg: "near", bold: true },
    "disabled-focused": { fg: "murmur", bg: "near" },
    popup: { fg: "voice", bg: "room" },
    "popup-border": { fg: "trace", bg: "room" },
    scrollbar: { fg: "trace", bg: "lull" },
    "timeline-bar": { bg: "murmur" },
    h1: { fg: "aside", bold: true, underline: true },
    h2: { fg: "aside", bold: true },
    h3: { fg: "aside", bold: true },
    h4: { fg: "voice", bold: true },
    h5: { fg: "murmur", bold: true },
    h6: { fg: "murmur", bold: true },
    hr: { fg: "trace" },
    hyperlink: { fg: "aside", underline: true },
    "list-glyph": { fg: "murmur" },
    breadcrumb: { fg: "murmur" },
    "table-border": { fg: "trace" },
    "table-header": { fg: "voice", bold: true },
    "quote-border": { fg: "trace" },
    "quoted-text": { fg: "whisper" },
    "footnote-border": { fg: "trace" },
    "footnote-text": { fg: "whisper" },
    "snippet-border": { fg: "trace" },
    "indent-guide": { fg: "trace" },
  },
  "syntax-styles": {
    "inline-code": { fg: "said", bg: "lull" },
    "quoted-code": { fg: "voice", bg: "room" },
    "code-border": { fg: "trace", bg: "room" },
    "object-key": { fg: "form" },
    keyword: { fg: "rest" },
    string: { fg: "said" },
    comment: { fg: "whisper" },
    "doc-directive": { fg: "aside" },
    variable: { fg: "voice" },
    symbol: { fg: "form" },
    "re-special": { fg: "rest" },
    "re-repeat": { fg: "aside" },
    "diff-delete": { fg: "sharp" },
    "diff-add": { fg: "grown" },
    "diff-section": { fg: "murmur" },
    "spectrogram-low": { fg: "pitch", bg: "grown" },
    "spectrogram-medium": { fg: "pitch", bg: "flat" },
    "spectrogram-high": { fg: "pitch", bg: "sharp" },
    file: { fg: "form" },
    null: { fg: "whisper" },
    "ascii-control": { fg: "murmur" },
    "non-ascii": { fg: "flat" },
    number: { fg: "said" },
    function: { fg: "call" },
    "separators-references-accessors": { fg: "murmur" },
    type: { fg: "form" },
  },
  "status-styles": {
    title: { fg: "call", bg: "near", bold: true },
    "disabled-title": { fg: "murmur", bg: "lull" },
    "alert-title": { fg: "sharp", bg: "near", bold: true },
    subtitle: { fg: "voice", bg: "near" },
    info: { fg: "murmur", bg: "lull" },
    "title-hotkey": { fg: "call", bg: "near", underline: true },
    hotkey: { fg: "call", underline: true },
    text: { fg: "voice", bg: "near" },
    warn: { fg: "flat", bg: "near" },
    alert: { fg: "sharp", bg: "near" },
    active: { fg: "grown", bg: "near" },
    inactive: { fg: "murmur", bg: "lull" },
    "inactive-warn": { fg: "flat", bg: "lull" },
    "inactive-alert": { fg: "sharp", bg: "lull" },
    suggestion: { fg: "whisper" },
  },
  "log-level-styles": {
    warning: { fg: "flat" },
    error: { fg: "sharp" },
    critical: { fg: "sharp", underline: true },
    fatal: { fg: "pitch", bg: "sharp" },
  },
};

const theme = (c: Colors) => {
  const style = ({ fg, bg, bold, underline }: Style) =>
    JSON.stringify({ ...(fg && { color: c[fg] }), ...(bg && { "background-color": c[bg] }), ...(bold && { bold }), ...(underline && { underline }) });
  const section = ([name, rows]: [string, Record<string, Style>]) =>
    `        "${name}": {\n${Object.entries(rows)
      .map(([key, value]) => `          "${key}": ${style(value)}`)
      .join(",\n")}\n        }`;
  return `{
  "$schema": "https://lnav.org/schemas/config-v1.schema.json",
  "ui": {
    "theme-defs": {
      "hush": {
${Object.entries(sections).map(section).join(",\n")}
      }
    }
  }
}
`;
};

export const lnav: Target = {
  name: "lnav",
  files: ({ colors }) => [{ path: "themes/lnav/hush.json", content: theme(colors) }],
};
