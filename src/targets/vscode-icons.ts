import { fileExtensions, fileNames, folderNames, languageIds } from "../icons/associations.ts";
import { files, folders } from "../icons/catalog.ts";
import { fileIcon, folderIcon } from "../icons/draw.ts";
import { spaced } from "../icons/library.ts";
import type { Colors, Name } from "../palette.ts";
import type { File } from "../target.ts";
import { json } from "../text.ts";

type Variant = { id: string; label: string; folder: string; paint: (shade: Name) => Name };
type Drawing = { id: string; svg: string };

const base = "themes/vscode/icons";
const outline: Name = "breath";

export const iconThemes: Variant[] = [
  { id: "sotto", label: "Sotto", folder: "color", paint: (shade) => shade },
  { id: "sotto-quiet", label: "Sotto Quiet", folder: "quiet", paint: () => outline },
];

function drawings(colors: Colors, variant: Variant): Drawing[] {
  const paint = (name: Name) => colors[variant.paint(name)];
  return [
    ...files.map((icon) => ({ id: icon.name, svg: fileIcon(icon, paint(icon.tone)) })),
    { id: "folder", svg: folderIcon(paint(outline)) },
    ...folders.map((icon) => ({ id: `folder-${icon.name}`, svg: folderIcon(paint(outline), { icon, color: paint(icon.tone) }) })),
  ];
}

export function iconSheet(colors: Colors): string {
  const variant = iconThemes[0];
  if (!variant) throw new Error("vscode icons: no icon theme to draw");
  const width = 1280;
  const pitch = 40;
  const size = 24;
  const columns = 29;
  const left = (width - (columns - 1) * pitch - size) / 2;
  const drawn = drawings(colors, variant);
  const height = 80 + Math.ceil(drawn.length / columns) * pitch - (pitch - size) + 80;
  const icons = drawn.map(({ svg }, index) => {
    const body = svg.replace(/^<svg[^>]*>|<\/svg>\s*$/g, "").replace(/ d="([^"]+)"/g, (_, path: string) => ` d="${spaced(path)}"`);
    return `<g transform="translate(${left + (index % columns) * pitch} ${80 + Math.floor(index / columns) * pitch}) scale(${size / 16})">${body}</g>`;
  });
  const marks = [32, width - 32].flatMap((x) => [32, height - 32].map((y) => `<path d="M${x - 5.5} ${y}h11M${x} ${y - 5.5}v11" stroke="${colors.trace}"/>`));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="${colors.pitch}"/>${marks.join("")}${icons.join("")}</svg>`;
}

export function vscodeIcons(colors: Colors): File[] {
  const badged = Object.fromEntries(Object.entries(folderNames).map(([name, icon]) => [name, `folder-${icon}`]));
  const maps = { folderNames: badged, folderNamesExpanded: badged, fileExtensions, fileNames, languageIds };
  return iconThemes.flatMap((variant) => {
    const drawn = drawings(colors, variant);
    return [
      ...drawn.map(({ id, svg }) => ({ path: `${base}/${variant.folder}/${id}.svg`, content: svg })),
      {
        path: `${base}/${variant.id}-icon-theme.json`,
        content: json({
          $schema: "vscode://schemas/icon-theme",
          iconDefinitions: Object.fromEntries(drawn.map(({ id }) => [id, { iconPath: `./${variant.folder}/${id}.svg` }])),
          showLanguageModeIcons: false,
          file: "file",
          folder: "folder",
          folderExpanded: "folder",
          rootFolder: "folder",
          rootFolderExpanded: "folder",
          ...maps,
        }),
      },
    ];
  });
}
