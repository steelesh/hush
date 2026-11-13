import type { Colors } from "../palette.ts";
import type { Target } from "../target.ts";

const theme = (c: Colors) => `[mgr]
cwd = { fg = "${c.voice}" }
find_keyword = { fg = "${c.call}", bold = true }
find_position = { fg = "${c.murmur}" }
symlink_target = { fg = "${c.whisper}" }
marker_selected = { fg = "${c.call}", bg = "${c.lull}" }
marker_copied = { fg = "${c.grown}", bg = "${c.lull}" }
marker_cut = { fg = "${c.sharp}", bg = "${c.lull}" }
marker_marked = { fg = "${c.aside}", bg = "${c.lull}" }
border_style = { fg = "${c.trace}" }
count_selected = { fg = "${c.pitch}", bg = "${c.call}" }
count_copied = { fg = "${c.pitch}", bg = "${c.grown}" }
count_cut = { fg = "${c.pitch}", bg = "${c.sharp}" }
syntect_theme = "~/.config/bat/themes/hush.tmTheme"

[indicator]
parent = { bg = "${c.lull}" }
current = { bg = "${c.near}", bold = true }
preview = { bg = "${c.lull}" }

[tabs]
active = { fg = "${c.pitch}", bg = "${c.call}", bold = true }
inactive = { fg = "${c.murmur}", bg = "${c.lull}" }

[mode]
normal_main = { fg = "${c.pitch}", bg = "${c.murmur}", bold = true }
normal_alt = { fg = "${c.murmur}", bg = "${c.lull}" }
select_main = { fg = "${c.pitch}", bg = "${c.call}", bold = true }
select_alt = { fg = "${c.call}", bg = "${c.lull}" }
unset_main = { fg = "${c.pitch}", bg = "${c.sharp}", bold = true }
unset_alt = { fg = "${c.sharp}", bg = "${c.lull}" }

[status]
progress_label = { fg = "${c.voice}", bold = true }
progress_normal = { fg = "${c.murmur}", bg = "${c.lull}" }
progress_error = { fg = "${c.sharp}", bg = "${c.lull}" }
perm_type = { fg = "${c.murmur}" }
perm_read = { fg = "${c.murmur}" }
perm_write = { fg = "${c.murmur}" }
perm_exec = { fg = "${c.murmur}" }
perm_sep = { fg = "${c.breath}" }

[which]
border = { fg = "${c.trace}" }
mask = { bg = "${c.room}" }
cand = { fg = "${c.call}" }
rest = { fg = "${c.breath}" }
desc = { fg = "${c.voice}" }
separator_style = { fg = "${c.trace}" }

[confirm]
border = { fg = "${c.trace}" }
title = { fg = "${c.call}", bold = true }
body = { fg = "${c.voice}" }
list = { fg = "${c.voice}" }
btn_yes = { fg = "${c.pitch}", bg = "${c.call}", bold = true }
btn_no = { fg = "${c.murmur}" }

[spot]
border = { fg = "${c.trace}" }
title = { fg = "${c.call}", bold = true }
tbl_col = { fg = "${c.murmur}" }
tbl_cell = { fg = "${c.voice}", bg = "${c.near}", bold = true }

[notify]
title_info = { fg = "${c.cue}" }
title_warn = { fg = "${c.flat}" }
title_error = { fg = "${c.sharp}" }

[input]
border = { fg = "${c.trace}" }
title = { fg = "${c.call}", bold = true }
value = { fg = "${c.voice}" }
selected = { bg = "${c.held}" }

[pick]
border = { fg = "${c.trace}" }
active = { fg = "${c.voice}", bg = "${c.near}", bold = true }
inactive = { fg = "${c.voice}" }

[cmp]
border = { fg = "${c.trace}" }
active = { fg = "${c.voice}", bg = "${c.near}", bold = true }
inactive = { fg = "${c.voice}" }

[tasks]
border = { fg = "${c.trace}" }
title = { fg = "${c.call}", bold = true }
hovered = { fg = "${c.voice}", bg = "${c.near}", bold = true }

[help]
border = { fg = "${c.trace}" }
chord = { fg = "${c.murmur}" }
action = { fg = "${c.voice}" }
hovered = { bg = "${c.near}", bold = true }

[filetype]
rules = [
  { url = "*", is = "dummy", fg = "${c.sharp}" },
  { url = "*/", is = "dummy", fg = "${c.sharp}" },
  { mime = "vfs/{absent,stale}", fg = "${c.breath}" },
  { url = "*/", fg = "${c.form}" },
  { url = "*", is = "orphan", fg = "${c.sharp}" },
  { url = "*", is = "link", fg = "${c.aside}" },
  { url = "*", is = "exec", fg = "${c.call}" },
  { mime = "**/image/*", fg = "${c.said}" },
  { mime = "**/{audio,video}/*", fg = "${c.said}" },
  { mime = "**/application/{zip,rar,7z*,tar,gzip,xz,zstd,bzip*,lzma,compress,archive,cpio,arj,xar,ms-cab*}", fg = "${c.rest}" },
  { url = "*", fg = "${c.voice}" },
]
`;

export const yazi: Target = {
  name: "yazi",
  files: ({ colors }) => [{ path: "themes/yazi/hush.toml", content: theme(colors) }],
};
