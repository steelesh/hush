import type { Colors, Name } from "../palette.ts";
import type { File } from "../target.ts";
import { json } from "../text.ts";
import { folderDefinitions, folderSvg } from "./jetbrains/icons.ts";

type Definition = {
  name: string;
  color: Name;
  glyph: string;
  extensions?: string[];
  filenames?: string[];
  languages?: string[];
};

const code = '<path d="m6.5 8.5-1.5 1.5 1.5 1.5m3-3 1.5 1.5-1.5 1.5"/>';
const letters: Record<string, string> = {
  j: "M6.5 7.5h4v2.5a2.5 2.5 0 0 1-5 0",
  t: "M5.5 7.5h4m-2 0v5",
  p: "M6.5 12.5v-5H9a1.5 1.5 0 0 1 0 3H6.5",
  r: "M6.5 12.5v-5H9a1.5 1.5 0 0 1 0 3H6.5m2 0 2 2",
  g: "M10 8.5a2.5 2.5 0 1 0 .45 2H8.5",
  l: "M6.5 7.5v5h4",
};
const letter = (name: string) => `<path d="${letters[name]}"/>`;

export const fileDefinitions: readonly Definition[] = [
  { name: "file", color: "murmur", glyph: '<path d="M5.5 8.5h3m-3 2h5"/>', languages: ["plaintext"] },
  {
    name: "code",
    color: "cue",
    glyph: code,
    extensions: [
      "c",
      "h",
      "cc",
      "cpp",
      "cxx",
      "hpp",
      "cs",
      "fs",
      "fsx",
      "vb",
      "swift",
      "kt",
      "kts",
      "scala",
      "sc",
      "clj",
      "cljs",
      "cljc",
      "edn",
      "ex",
      "exs",
      "erl",
      "hrl",
      "hs",
      "lhs",
      "dart",
      "php",
      "pl",
      "pm",
      "r",
      "jl",
      "zig",
      "nim",
      "nix",
      "ml",
      "mli",
      "cl",
      "lisp",
      "el",
      "scm",
      "vue",
      "svelte",
      "astro",
      "sol",
      "groovy",
    ],
    languages: [
      "c",
      "cpp",
      "csharp",
      "fsharp",
      "vb",
      "swift",
      "kotlin",
      "scala",
      "clojure",
      "elixir",
      "erlang",
      "haskell",
      "dart",
      "php",
      "perl",
      "r",
      "julia",
      "zig",
      "nim",
      "nix",
      "ocaml",
      "lisp",
      "scheme",
      "vue",
      "svelte",
      "astro",
      "solidity",
      "groovy",
      "objective-c",
      "objective-cpp",
    ],
  },
  {
    name: "java",
    color: "said",
    glyph: '<path d="M5.5 8.5h4v2a2 2 0 0 1-4 0Zm4 .5a1 1 0 0 1 0 2"/>',
    extensions: ["java"],
    languages: ["java"],
  },
  { name: "javascript", color: "said", glyph: letter("j"), extensions: ["js", "mjs", "cjs", "jsx"], languages: ["javascript", "javascriptreact"] },
  { name: "typescript", color: "cue", glyph: letter("t"), extensions: ["ts", "mts", "cts", "tsx"], languages: ["typescript", "typescriptreact"] },
  { name: "python", color: "said", glyph: letter("p"), extensions: ["py", "pyi", "pyw", "pyx", "pxd"], languages: ["python", "cython"] },
  { name: "rust", color: "call", glyph: letter("r"), extensions: ["rs"], languages: ["rust"] },
  { name: "go", color: "rest", glyph: letter("g"), extensions: ["go"], languages: ["go"] },
  {
    name: "ruby",
    color: "call",
    glyph: '<path d="m8 7.5 2.5 2.5-2.5 2.5-2.5-2.5Z"/>',
    extensions: ["rb", "rake", "gemspec", "erb"],
    filenames: ["gemfile", "rakefile", "brewfile"],
    languages: ["ruby", "erb"],
  },
  { name: "lua", color: "aside", glyph: letter("l"), extensions: ["lua", "luau"], languages: ["lua", "luau"] },
  {
    name: "shell",
    color: "grown",
    glyph: '<path d="m5.5 8.5 1.5 1.5-1.5 1.5m3 0h2"/>',
    extensions: ["sh", "bash", "zsh", "fish", "ps1", "psm1", "bat", "cmd"],
    filenames: [".bashrc", ".bash_profile", ".zshrc", ".zprofile", ".profile", "gradlew", "mvnw"],
    languages: ["shellscript", "powershell", "bat", "fish"],
  },
  {
    name: "markup",
    color: "call",
    glyph: '<path d="m6 8.5-1.5 1.5 1.5 1.5m4-3 1.5 1.5-1.5 1.5m-1-4-2 5"/>',
    extensions: ["html", "htm", "xhtml", "xml", "xsd", "xsl", "xslt", "dtd", "jsp"],
    languages: ["html", "xml", "xsl", "jade", "pug", "handlebars"],
  },
  {
    name: "style",
    color: "aside",
    glyph: '<path d="M6.5 7.5h-1v2l-1 .5 1 .5v2h1m3-5h1v2l1 .5-1 .5v2h-1"/>',
    extensions: ["css", "scss", "sass", "less", "styl"],
    languages: ["css", "scss", "sass", "less", "stylus"],
  },
  {
    name: "data",
    color: "said",
    glyph: '<path d="M6.5 7.5h-1v5h1m3-5h1v5h-1M8 9v.01m0 2v.01"/>',
    extensions: ["json", "jsonc", "json5", "jsonl", "ndjson", "yaml", "yml", "toml", "csv", "tsv", "properties", "ini", "env"],
    languages: ["json", "jsonc", "jsonl", "yaml", "toml", "csv", "tsv", "properties", "ini", "dotenv"],
  },
  {
    name: "config",
    color: "murmur",
    glyph: '<path d="M5.5 8.5h5m-5 3h5m-4-4v2m3 1v2"/>',
    extensions: ["conf", "config", "cfg", "gradle", "gradle.kts", "code-workspace"],
    filenames: [
      ".editorconfig",
      ".npmrc",
      ".yarnrc",
      ".prettierrc",
      ".prettierignore",
      ".eslintrc",
      ".eslintignore",
      "biome.json",
      "biome.jsonc",
      "tsconfig.json",
      "jsconfig.json",
      "package.json",
      "pyproject.toml",
      "cargo.toml",
      "go.mod",
      "go.work",
      ".mise.toml",
      "mise.toml",
      "makefile",
      "gnumakefile",
      "cmakelists.txt",
      "dockerfile",
      "containerfile",
      ".dockerignore",
      "justfile",
      ".tool-versions",
    ],
    languages: ["dockerfile", "makefile", "cmake", "terraform", "hcl", "just"],
  },
  {
    name: "docs",
    color: "murmur",
    glyph: '<path d="M5.5 8.5h3m-3 2h5m-5 2h4"/>',
    extensions: ["md", "mdx", "markdown", "rst", "adoc", "asciidoc", "txt", "tex", "typ", "pdf", "doc", "docx", "rtf"],
    filenames: ["readme", "changelog", "authors", "contributors"],
    languages: ["markdown", "mdx", "restructuredtext", "asciidoc", "latex", "tex", "typst", "log"],
  },
  {
    name: "test",
    color: "grown",
    glyph: '<path d="m5.5 10 1.5 1.5 3.5-3.5"/>',
    extensions: ["test.js", "test.jsx", "test.ts", "test.tsx", "spec.js", "spec.jsx", "spec.ts", "spec.tsx", "test.mjs", "test.cjs", "feature"],
    languages: ["cucumber"],
  },
  {
    name: "git",
    color: "call",
    glyph: '<circle cx="5.5" cy="8" r="1"/><circle cx="5.5" cy="12" r="1"/><circle cx="10.5" cy="8" r="1"/><path d="M5.5 9v2m5-2v.5c0 1-5 1-5 1"/>',
    filenames: [".gitignore", ".gitattributes", ".gitmodules", ".gitkeep", ".gitconfig", ".gitmessage", "codeowners"],
    languages: ["git-commit", "git-rebase", "ignore"],
  },
  {
    name: "lock",
    color: "said",
    glyph: '<rect x="5.5" y="9.5" width="5" height="3" rx="1"/><path d="M6.5 9.5v-1a1.5 1.5 0 0 1 3 0v1"/>',
    extensions: ["lock", "lockb"],
    filenames: [
      "package-lock.json",
      "npm-shrinkwrap.json",
      "pnpm-lock.yaml",
      "yarn.lock",
      "bun.lock",
      "bun.lockb",
      "cargo.lock",
      "gemfile.lock",
      "poetry.lock",
      "uv.lock",
      "go.sum",
      "gradle.lockfile",
      "lazy-lock.json",
    ],
  },
  {
    name: "archive",
    color: "said",
    glyph: '<path d="M7 7.5h2m-2 2h2m-2 2h2"/>',
    extensions: ["zip", "gz", "bz2", "xz", "zst", "tar", "tgz", "7z", "rar", "jar", "war", "ear", "vsix", "whl"],
    languages: [],
  },
  {
    name: "image",
    color: "form",
    glyph: '<circle cx="6.5" cy="8.5" r="1"/><path d="m5 12.5 2-2 2 2 1-1 1 1"/>',
    extensions: ["svg", "png", "jpg", "jpeg", "gif", "webp", "avif", "ico", "icns", "bmp", "tif", "tiff", "heic", "psd", "ai"],
    languages: ["svg"],
  },
  {
    name: "audio",
    color: "aside",
    glyph: '<path d="M7.5 12V8l3-.5v4"/><ellipse cx="6.5" cy="12" rx="1" ry=".75"/><ellipse cx="9.5" cy="11.5" rx="1" ry=".75"/>',
    extensions: ["mp3", "wav", "flac", "ogg", "m4a", "aac", "aiff", "opus", "mid", "midi"],
  },
  { name: "video", color: "aside", glyph: '<path d="m6.5 7.5 4 2.5-4 2.5Z"/>', extensions: ["mp4", "mov", "webm", "mkv", "avi", "m4v", "mpeg", "mpg"] },
  { name: "font", color: "aside", glyph: '<path d="m5.5 12.5 2.5-5 2.5 5M6.5 10.5h3"/>', extensions: ["ttf", "otf", "woff", "woff2", "eot"] },
  {
    name: "database",
    color: "form",
    glyph: '<ellipse cx="8" cy="8.5" rx="2.5" ry="1"/><path d="M5.5 8.5v3c0 1.3 5 1.3 5 0v-3m-5 1.5c0 1.3 5 1.3 5 0"/>',
    extensions: ["sql", "db", "sqlite", "sqlite3", "prisma", "graphql", "gql", "proto"],
    languages: ["sql", "prisma", "graphql", "proto3"],
  },
  {
    name: "binary",
    color: "murmur",
    glyph: '<rect x="5.5" y="8.5" width="2" height="3" rx="1"/><path d="m9 9 .5-.5v3m-1 0h2"/>',
    extensions: ["o", "obj", "so", "dylib", "dll", "exe", "bin", "wasm", "class", "pyc", "pyo"],
  },
  {
    name: "notebook",
    color: "said",
    glyph: '<rect x="5.5" y="7.5" width="5" height="5" rx="1"/><path d="M7.5 7.5v5m-3-4h2m-2 3h2"/>',
    extensions: ["ipynb"],
    languages: ["jupyter"],
  },
  { name: "diff", color: "grown", glyph: '<path d="M6.5 7.5v4m-2-2h4m1 2h2"/>', extensions: ["diff", "patch"], languages: ["diff"] },
  {
    name: "license",
    color: "murmur",
    glyph: '<path d="m8 7.5 2.5 1v1.5c0 1.5-2.5 2.5-2.5 2.5s-2.5-1-2.5-2.5V8.5Z"/>',
    filenames: ["license", "license.md", "license.txt", "licence", "licence.md", "licence.txt", "copying", "notice", "notice.txt"],
  },
];

const folderNames: Record<string, string[]> = {
  source: ["src", "source", "sources", "app", "apps", "lib"],
  test: ["test", "tests", "__tests__", "spec", "specs", "e2e", "__mocks__", "fixtures"],
  resources: ["resources", "assets", "static", "public", "images", "fonts", "media"],
  docs: ["docs", "doc", "documentation"],
  generated: ["generated", "gen", "dist", "build", "out", "target", "coverage", ".next", ".nuxt"],
  library: ["node_modules", "vendor", ".venv", "venv"],
  config: ["config", "configs", ".config", ".vscode", ".idea", ".settings", ".claude", ".codex", ".agents"],
  github: [".github", ".git", ".gitlab"],
  log: ["log", "logs"],
  template: ["templates", "views"],
};

function associations(field: "extensions" | "filenames" | "languages"): Record<string, string> {
  const result: Record<string, string> = {};
  for (const definition of fileDefinitions) {
    for (const value of definition[field] ?? []) {
      if (result[value]) throw new Error(`vscode icons: duplicate ${field} association ${value}`);
      result[value] = `file-${definition.name}`;
    }
  }
  return result;
}

export function fileSvg(colors: Colors, definition: Definition): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><g fill="none" stroke="${colors[definition.color]}" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 1.5h-6a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-8Zm0 0v4h4" stroke-opacity=".55"/>${definition.glyph}</g></svg>\n`;
}

function folders() {
  const wanted = new Set(["folder", "project", ...Object.keys(folderNames)]);
  return folderDefinitions.filter((folder) => wanted.has(folder.name));
}

export function iconSheet(colors: Colors): string {
  const width = 1280;
  const pitch = 72;
  const columns = 15;
  const left = (width - (columns - 1) * pitch - 48) / 2;
  const rows = [folders().map((folder) => folderSvg(colors, folder))];
  const glyphs = fileDefinitions.map((definition) => fileSvg(colors, definition));
  for (let start = 0; start < glyphs.length; start += columns) rows.push(glyphs.slice(start, start + columns));
  const tops = rows.map((_, row) => 80 + row * pitch + (row > 0 ? 24 : 0));
  const height = (tops.at(-1) ?? 0) + 48 + 80;
  const icons = rows.flatMap((row, index) =>
    row.map((svg, column) => `<g transform="translate(${left + column * pitch} ${tops[index]}) scale(3)">${svg.replace(/^<svg[^>]*>|<\/svg>\s*$/g, "")}</g>`),
  );
  const marks = [32, width - 32].flatMap((x) => [32, height - 32].map((y) => `<path d="M${x - 5.5} ${y}h11M${x} ${y - 5.5}v11" stroke="${colors.trace}"/>`));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="${colors.pitch}"/>${marks.join("")}${icons.join("")}</svg>`;
}

export function vscodeIcons(colors: Colors): File[] {
  const assets = [
    ...folders().map((folder) => ({ path: `themes/vscode/icons/folder-${folder.name}.svg`, content: folderSvg(colors, folder) })),
    ...fileDefinitions.map((definition) => ({ path: `themes/vscode/icons/file-${definition.name}.svg`, content: fileSvg(colors, definition) })),
  ];
  const namedFolders = Object.fromEntries(Object.entries(folderNames).flatMap(([role, names]) => names.map((name) => [name, `folder-${role}`])));
  return [
    ...assets,
    {
      path: "themes/vscode/icons/sotto-icon-theme.json",
      content: json({
        $schema: "vscode://schemas/icon-theme",
        iconDefinitions: Object.fromEntries(
          assets.map(({ path }) => {
            const name = path.split("/").at(-1) ?? "";
            return [name.replace(/\.svg$/, ""), { iconPath: `./${name}` }];
          }),
        ),
        showLanguageModeIcons: false,
        file: "file-file",
        folder: "folder-folder",
        folderExpanded: "folder-folder",
        rootFolder: "folder-project",
        rootFolderExpanded: "folder-project",
        folderNames: namedFolders,
        folderNamesExpanded: namedFolders,
        fileExtensions: associations("extensions"),
        fileNames: associations("filenames"),
        languageIds: associations("languages"),
      }),
    },
  ];
}
