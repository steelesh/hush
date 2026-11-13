import type { Colors } from "../palette.ts";
import type { Target } from "../target.ts";

const theme = (c: Colors) => `--color=bg+:${c.near}
--color=border:${c.trace}
--color=fg:${c.voice}
--color=fg+:${c.voice}:bold
--color=footer:${c.murmur}
--color=ghost:${c.breath}
--color=header:${c.murmur}
--color=hl:${c.call}:bold
--color=hl+:${c.call}:bold
--color=info:${c.whisper}
--color=label:${c.call}:bold
--color=marker:${c.call}
--color=nomatch:${c.breath}
--color=pointer:${c.call}
--color=prompt:${c.call}
--color=query:${c.voice}:regular
--color=spinner:${c.breath}
`;

export const fzf: Target = {
  name: "fzf",
  files: ({ colors }) => [{ path: "themes/fzf/hush.fzf", content: theme(colors) }],
};
