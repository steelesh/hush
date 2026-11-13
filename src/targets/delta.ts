import type { Colors } from "../palette.ts";
import type { Target } from "../target.ts";

const theme = (c: Colors) => `[delta]
	dark = true
	syntax-theme = sotto
	minus-style = syntax "${c.tint_delete}"
	minus-emph-style = syntax "${c.tint_delete_strong}"
	plus-style = syntax "${c.tint_add}"
	plus-emph-style = syntax "${c.tint_add_strong}"
	line-numbers-left-style = "${c.trace}"
	line-numbers-right-style = "${c.trace}"
	line-numbers-zero-style = "${c.breath}"
	line-numbers-minus-style = "${c.sharp}"
	line-numbers-plus-style = "${c.grown}"
	file-style = "${c.call}" bold
	file-decoration-style = "${c.trace}" ul
	hunk-header-style = line-number "${c.murmur}"
	hunk-header-file-style = "${c.murmur}"
	hunk-header-line-number-style = "${c.murmur}"
	hunk-header-decoration-style = "${c.trace}" box
	merge-conflict-ours-diff-header-decoration-style = "${c.trace}" box
	merge-conflict-theirs-diff-header-decoration-style = "${c.trace}" box
	whitespace-error-style = "${c.sharp}" reverse
	inline-hint-style = "${c.breath}"
	grep-file-style = "${c.call}"
	grep-line-number-style = "${c.breath}"
	grep-match-word-style = "${c.voice}" "${c.tint_search}"
	blame-palette = "${c.pitch} ${c.room} ${c.lull}"
	map-styles = bold purple => syntax "${c.tint_change}", bold blue => syntax "${c.tint_change}", bold cyan => syntax "${c.tint_change}", bold yellow => syntax "${c.tint_change}"
`;

export const delta: Target = {
  name: "delta",
  files: ({ colors }) => [{ path: "themes/delta/sotto.gitconfig", content: theme(colors) }],
};
